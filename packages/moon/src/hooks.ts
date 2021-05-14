import * as React from "react";
import {
  QueryObserver,
  QueriesObserver,
  hashQueryKey,
  InfiniteQueryObserver,
  notifyManager,
  QueryKey,
  InfiniteQueryObserverOptions,
  QueryObserverOptions,
  UseQueryResult,
  UseInfiniteQueryResult,
  QueryObserverResult,
  InfiniteData
} from "react-query";
import { Query, QueryState } from "react-query/types/core/query";

import { MoonContext, RquiredMoonContextValue } from "./moonProvider";
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
): QueryState<Data | InfiniteData<Data> | undefined> | undefined {
  if (!query || !result) {
    return undefined;
  }
  const { data: newData, dataUpdatedAt, isFetching, error, errorUpdatedAt, status } = result;
  const networkOnly = query.cacheTime === 0;
  const cachedData = query.state.data;
  const data = newData || cachedData;
  const queryData = !isInfinite && isFetching && networkOnly ? undefined : data;
  return { ...query?.state, dataUpdatedAt, isFetching, error, errorUpdatedAt, status, data: queryData };
}

export function useQueryObserver<State = any, Data = any>(
  queryId: string,
  getState: GetState<Data, State>,
  isInfinite = false
): State | undefined {
  const { store } = useMoon();
  const isMounted = useIsMounted();
  const query = store.getQueryCache().get<Data>(hashQueryKey(queryId));
  const initialSate = getState(query);
  const [state, setState] = React.useState<State | undefined>(initialSate);

  const observerRef = React.useRef<InfiniteQueryObserver<Data> | QueryObserver<Data>>();
  const defaultOptions: InfiniteQueryObserverOptions<Data> | QueryObserverOptions<Data> = React.useMemo(
    () => store.defaultQueryObserverOptions<Data, unknown, Data, Data, QueryKey>({ queryKey: queryId, enabled: false }),
    [queryId]
  );
  const createObserver = React.useCallback(() => {
    return isInfinite
      ? new InfiniteQueryObserver<Data>(store, defaultOptions as InfiniteQueryObserverOptions<Data>)
      : new QueryObserver<Data>(store, defaultOptions);
  }, [isInfinite, store, defaultOptions]);
  const observer = observerRef.current || createObserver();
  observerRef.current = observer;

  if (observer.hasListeners()) {
    // @ts-ignore InfiniteQueryObserver | QueryObserver
    observer.setOptions(defaultOptions);
  }

  const listener = React.useCallback(
    (result: UseQueryResult<Data> | UseInfiniteQueryResult<Data>) => {
      if (isMounted()) {
        const queryState = getState(query, result);
        if (!equal(state || null, queryState || null)) {
          setState(queryState);
        }
      }
    },
    [queryId]
  );

  React.useEffect(() => {
    return observer.subscribe(notifyManager.batchCalls(listener));
  }, [queryId]);

  return state;
}

export function useQueriesObserver<State = any>(queriesIds: string[], getState: GetState<unknown, State>): QueriesResults {
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const { store } = useMoon();
  const isMounted = useIsMounted();

  const queriesResults = React.useMemo(() => {
    return currentQueriesIds.reduce<QueriesResults<State>>((result, queryId) => {
      const query = store.getQueryCache().get(hashQueryKey(queryId));
      result[queryId] = getState(query);
      return result;
    }, {});
  }, [currentQueriesIds, store]);

  const [states, setStates] = React.useState<QueriesResults>(queriesResults);

  const queries = React.useMemo(() => {
    return queriesIds.map(queryId =>
      store.defaultQueryObserverOptions<unknown, unknown, unknown, unknown, QueryKey>({ queryKey: queryId, enabled: false })
    );
  }, [currentQueriesIds]);

  const observerRef = React.useRef<QueriesObserver>();
  const observer = observerRef.current || new QueriesObserver(store, queries);
  observerRef.current = observer;

  if (observer.hasListeners()) {
    observer.setQueries(queries);
  }
  const listener = React.useCallback(
    (results: QueryObserverResult[]) => {
      if (isMounted()) {
        queriesIds.forEach((queryId, index) => {
          const query = store.getQueryCache().get(hashQueryKey(queryId));
          const queryState = getState(query, results[index]);
          if (!equal(states[queryId] || null, queryState || null)) {
            setStates({ [queryId]: queryState });
          }
        });
      }
    },
    [currentQueriesIds]
  );

  React.useEffect(() => {
    return observer.subscribe(notifyManager.batchCalls(listener));
  }, [currentQueriesIds]);

  return states;
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
  const valueRef = React.useRef<Value>(value);
  const prevValue = valueRef.current;
  //@ts-ignore prevValue is an object
  if (typeof prevValue === "object" && typeof value === "object" && !equal(prevValue, value, true)) {
    valueRef.current = value;
  }
  return { value: valueRef.current, prevValue };
}

export function useMoon(): RquiredMoonContextValue {
  const moonContext = React.useContext(MoonContext);
  const { client, store } = moonContext;
  if (!client || !store) {
    throw new Error("Invariant Violation: Please wrap the root component in a <MoonProvider>");
  }
  return moonContext as RquiredMoonContextValue;
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
