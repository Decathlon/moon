import * as React from "react";
import { useQueryCache, QueryCache, Query } from "react-query";
import { QueryState } from "react-query/types/core/query";

import shallowEqual from "./utils/shallow-equal";
import { MoonContext, RquiredMoonContextValue } from "./moon-provider";

export interface QueriesStates {
  [queryId: string]: QueryState<unknown, unknown> | undefined;
}

export interface ResultProps {
  [propName: string]: any;
}

export interface QueriesResults<Data = any> {
  [queryId: string]: Data | undefined;
}

export function useQueryResult<Data = any, Props = ResultProps>(
  queryId: string,
  resultToProps?: (state?: Data) => Props
): Data | Props | undefined {
  const queryCache = useQueryCache();
  const queryResult = queryCache.getQueryData<Data>(queryId);
  const [state, setState] = React.useState<Data | undefined>(queryResult);

  const listener = React.useCallback(
    (cache: QueryCache, query?: Query<unknown, unknown>) => {
      if ((query?.queryKey || []).includes(queryId)) {
        const queryData = cache.getQueryData<Data>(queryId);
        if (!shallowEqual(state || null, queryData || null)) {
          setState(queryData);
        }
      }
    },
    [queryId]
  );
  const unsubscribe = queryCache.subscribe(listener);

  React.useEffect(() => {
    return unsubscribe;
  }, [queryId]);

  return resultToProps ? resultToProps(state) : state;
}

export function useQueriesResults<Data = any, Props = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults<Data>) => Props
): QueriesResults<Data> | Props {
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queryCache = useQueryCache();
  const readQueriesResults = () => {
    return currentQueriesIds.reduce<QueriesResults<Data>>((result, queryId) => {
      result[queryId] = queryCache.getQueryData<Data>(queryId);
      return result;
    }, {});
  };
  const [states, setStates] = React.useState<QueriesResults<Data>>(readQueriesResults());

  const listener = React.useCallback(
    (cache: QueryCache, query?: Query<unknown, unknown>) => {
      const queryKeys = query?.queryKey || [];
      if (queryKeys.some(queryId => typeof queryId === "string" && currentQueriesIds.includes(queryId))) {
        const queryId = queryKeys[0] as string;
        const queryData = cache.getQueryData<Data>(queryId);
        if (!shallowEqual(states[queryId] || null, queryData || null)) {
          setStates({ [queryId]: queryData });
        }
      }
    },
    [currentQueriesIds]
  );
  const unsubscribe = queryCache.subscribe(listener);

  React.useEffect(() => {
    return unsubscribe;
  }, [currentQueriesIds]);

  return resultsToProps ? resultsToProps(states) : states;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state: QueryState<Data, unknown>) => Props
): QueryState<Data, unknown> | Props | undefined {
  const queryCache = useQueryCache();
  const query = queryCache.getQuery<Data>(queryId);
  const [state, setState] = React.useState<QueryState<Data, unknown> | undefined>(query?.state);

  const listener = React.useCallback(
    (cache: QueryCache, query?: Query<unknown, unknown>) => {
      if ((query?.queryKey || []).includes(queryId)) {
        const query = cache.getQuery<Data>(queryId);
        if (!shallowEqual(state || null, query?.state || null)) {
          setState(query?.state);
        }
      }
    },
    [queryId]
  );
  const unsubscribe = queryCache.subscribe(listener);

  React.useEffect(() => {
    return unsubscribe;
  }, [queryId]);

  return stateToProps && state ? stateToProps(state) : state;
}

export function useQueriesStates<Props = ResultProps>(
  queriesIds: string[],
  statesToProps?: (states: QueriesStates) => Props
): QueriesStates | Props {
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queryCache = useQueryCache();
  const readQueriesStates = () => {
    return currentQueriesIds.reduce<QueriesStates>((result, queryId) => {
      result[queryId] = queryCache.getQuery(queryId)?.state;
      return result;
    }, {});
  };
  const [states, setStates] = React.useState<QueriesStates>(readQueriesStates());

  const listener = React.useCallback(
    (cache: QueryCache, query?: Query<unknown, unknown>) => {
      const queryKeys = query?.queryKey || [];
      if (queryKeys.some(queryId => typeof queryId === "string" && currentQueriesIds.includes(queryId))) {
        const queryId = queryKeys[0] as string;
        const queryState = cache.getQuery(queryId)?.state;
        if (!shallowEqual(states[queryId] || null, queryState || null)) {
          setStates({ [queryId]: queryState });
        }
      }
    },
    [currentQueriesIds]
  );
  const unsubscribe = queryCache.subscribe(listener);

  React.useEffect(() => {
    return unsubscribe;
  }, [currentQueriesIds]);

  return statesToProps ? statesToProps(states) : states;
}

export function usePrevValue<Value = any>(value: Value): { value: Value; prevValue: Value } {
  const valueRef = React.useRef<Value>(value);
  const prevValue = valueRef.current;
  //@ts-ignore prevValue is an object
  if (typeof prevValue === "object" && typeof value === "object" && !shallowEqual(prevValue, value)) {
    valueRef.current = value;
  }
  return { value: valueRef.current, prevValue };
}

export function useMoon(): RquiredMoonContextValue {
  const moonContext = React.useContext(MoonContext);
  const { client } = moonContext;
  if (!client) {
    throw new Error("Invariant Violation: Please wrap the root component in a <MoonProvider>");
  }
  return moonContext as RquiredMoonContextValue;
}
