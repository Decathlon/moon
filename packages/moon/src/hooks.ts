import * as React from "react";

import {
  hashId,
  toQueryKey,
  useQueries,
  useObservedQuery,
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData,
  Query,
  QueryState
} from "./compat";
import { MoonContext, RequiredMoonContextValue } from "./moonProvider";
import { equal, isServer } from "./utils";

export interface QueriesStates {
  [queryId: string]: QueryState<unknown, unknown> | undefined;
}

export interface ResultProps {
  [propName: string]: any;
}

export interface QueriesResults<Data = any> {
  [queryId: string]: Data | undefined;
}

export type GetState<Data = any, State = Data> = (
  query: Query<Data> | undefined,
  result?: QueryState<Data> | UseQueryResult<Data> | UseInfiniteQueryResult<Data> | undefined,
  isInfinite?: boolean
) => State | undefined;

export function getAdaptedQueryState<Data>(
  query: Query<Data> | undefined,
  result: QueryState<Data> | UseQueryResult<Data> | UseInfiniteQueryResult<Data> | undefined = query?.state,
  isInfinite = false
): (QueryState<Data | InfiniteData<Data> | undefined> & { isFetching: boolean }) | undefined {
  if (!query || !result) {
    return undefined;
  }
  // `isFetching` is on the hook results (UseQueryResult / UseInfiniteQueryResult) but not on
  // QueryState (v5 only exposes `fetchStatus` there) — derive a unified boolean.
  const isFetching =
    "isFetching" in result
      ? Boolean((result as UseQueryResult<Data>).isFetching)
      : (result as QueryState<Data>).fetchStatus === "fetching";
  const { data: newData, dataUpdatedAt, error, errorUpdatedAt, status } = result;
  const networkOnly = query.gcTime === 0;
  const cachedData = query.state.data;
  const data = newData || cachedData;
  const queryData = !isInfinite && isFetching && networkOnly ? undefined : data;
  return { ...query?.state, dataUpdatedAt, error, errorUpdatedAt, status, data: queryData, isFetching };
}

/**
 * Subscribe to a single query in the cache.
 *
 * Internally piggybacks on the native `useQuery({ enabled: false })` hook:
 * TanStack Query already wires the subscription, the equality comparison and
 * the re-render on cache change — Moon used to re-implement that on top of
 * a `QueryObserver` (≈50 lines plus listener/effect plumbing). This wrapper
 * is the same observation, served by the native primitive.
 */
export function useQueryObserver<State = any, Data = any>(
  queryId: string,
  getState: GetState<Data, State>,
  isInfinite = false
): State | undefined {
  const { store } = useMoon();
  // Subscribes to the cache entry; re-renders this component whenever the
  // entry's state changes.
  const result = useObservedQuery<Data>(queryId);
  // Fetch the matching `Query` object so `getState` has access to the full
  // metadata (gcTime, etc.).
  const query = store.getQueryCache().get<Data>(hashId(queryId)) as Query<Data> | undefined;
  return getState(query, result as UseQueryResult<Data> | UseInfiniteQueryResult<Data>, isInfinite);
}

/**
 * Subscribe to multiple queries in the cache. Same trick as `useQueryObserver`
 * but built on `useQueries` so re-renders only fire when at least one observed
 * entry changes.
 */
export function useQueriesObserver<State = any>(queriesIds: string[], getState: GetState<unknown, State>): QueriesResults {
  const { value: ids } = usePrevValue(queriesIds);
  const { store } = useMoon();

  const queries = React.useMemo(
    () =>
      ids.map(id => ({
        queryKey: toQueryKey(id),
        queryFn: () => undefined,
        enabled: false
      })),
    [ids]
  );

  const results = useQueries({ queries: queries as never }) as ReadonlyArray<UseQueryResult<unknown>>;

  return React.useMemo<QueriesResults<State>>(
    () =>
      ids.reduce<QueriesResults<State>>((acc, id, index) => {
        const query = store.getQueryCache().get(hashId(id)) as Query<unknown> | undefined;
        acc[id] = getState(query, results[index]);
        return acc;
      }, {}),
    // `store` and `getState` change every render but are stable; we recompute
    // only when the observed ids set or the underlying results change.
    [ids, results]
  );
}

export function useQueryResult<Data = any, Props = ResultProps>(
  queryId: string,
  resultToProps?: (state?: Data | InfiniteData<Data>) => Props,
  isInfinite = false
): Data | InfiniteData<Data> | Props | undefined {
  const getData: GetState<Data, Data | InfiniteData<Data>> = (query, result) => {
    const queryState = getAdaptedQueryState<Data>(query, result);
    return queryState?.data;
  };

  const queryResult = useQueryObserver<Data | InfiniteData<Data>, Data>(queryId, getData, isInfinite);
  return resultToProps ? resultToProps(queryResult) : queryResult;
}

export function useQueriesResults<Props = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults) => Props
): QueriesResults | Props {
  const getState: GetState = (query, result) => {
    const queryState = getAdaptedQueryState(query, result);
    return queryState?.data;
  };
  const queriesResult = useQueriesObserver(queriesIds, getState);
  return resultsToProps ? resultsToProps(queriesResult) : queriesResult;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state?: QueryState<Data | InfiniteData<Data> | undefined, unknown>) => Props,
  isInfinite = false
): QueryState<Data | InfiniteData<Data> | undefined, unknown> | Props | undefined {
  const queryResult = useQueryObserver<QueryState<Data | InfiniteData<Data> | undefined, unknown>, Data>(
    queryId,
    getAdaptedQueryState,
    isInfinite
  );
  return stateToProps ? stateToProps(queryResult) : queryResult;
}

export function useQueriesStates<Props = ResultProps>(
  queriesIds: string[],
  statesToProps?: (states: QueriesStates) => Props
): QueriesStates | Props {
  const queriesResult = useQueriesObserver(queriesIds, getAdaptedQueryState);
  return statesToProps ? statesToProps(queriesResult) : queriesResult;
}

export function usePrevValue<Value = any>(value: Value): { value: Value; prevValue: Value } {
  // Tracks the previous value as a ref. We mutate the ref inside `useMemo`
  // (not directly during render) so React 18 strict-mode double-render does
  // not desynchronise the ref with the rendered value.
  const valueRef = React.useRef<Value>(value);
  const previousRef = React.useRef<Value>(value);

  React.useMemo(() => {
    const { current } = valueRef;
    const isDeepObject = typeof current === "object" && current !== null && typeof value === "object" && value !== null;
    if (!isDeepObject) {
      // Primitive or null: update only when the identity differs.
      if (current !== value) {
        previousRef.current = current;
        valueRef.current = value;
      }
      return;
    }
    // Object: deep compare so a stable reference doesn't trigger churn.
    if (!equal((current as unknown) as Record<string, unknown>, (value as unknown) as Record<string, unknown>, true)) {
      previousRef.current = current;
      valueRef.current = value;
    }
  }, [value]);

  return { value: valueRef.current, prevValue: previousRef.current };
}

export function useMoon(): RequiredMoonContextValue {
  const moonContext = React.useContext(MoonContext);
  const { client, store } = moonContext;
  if (!client || !store) {
    throw new Error("Invariant Violation: Please wrap the root component in a <MoonProvider>");
  }
  return moonContext as RequiredMoonContextValue;
}

export function useIsMounted(): () => boolean {
  const mountedRef = React.useRef(false);
  const isMounted = React.useCallback(() => mountedRef.current, []);
  const useEffect = isServer ? React.useEffect : React.useLayoutEffect;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return isMounted;
}
