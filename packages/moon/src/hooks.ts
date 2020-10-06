import * as React from "react";
import { QueryCache } from "react-query";
import { Query, QueryState } from "react-query/types/core/query";

import { MoonContext, RquiredMoonContextValue } from "./moon-provider";
import { equal } from "./utils";

export interface QueriesStates {
  [queryId: string]: QueryState<unknown, unknown> | undefined;
}

export interface ResultProps {
  [propName: string]: any;
}

export interface QueriesResults<Data = any> {
  [queryId: string]: Data | undefined;
}

// cacheTime=0 not working
export function getAdaptedQueryState<Data>(store: QueryCache, queryId: string): QueryState<Data, unknown> | undefined {
  const query = store.getQuery<Data>(queryId);
  if (!query) {
    return undefined;
  }
  const networkOnly = query?.cacheTime === 0;
  const { state } = (query as unknown) as Query<Data, unknown>;
  const { isFetching, data } = state;
  const queryData = isFetching && networkOnly ? undefined : data;
  return { ...state, data: queryData };
}

export function useQueryResult<Data = any, Props = ResultProps>(
  queryId: string,
  resultToProps?: (state?: Data) => Props
): Data | Props | undefined {
  const { store } = useMoon();
  const queryState = getAdaptedQueryState<Data>(store, queryId);
  const queryResult = queryState?.data;
  const [state, setState] = React.useState<Data | undefined>(queryResult);

  const listener = React.useCallback(() => {
    const queryState = getAdaptedQueryState<Data>(store, queryId);
    const queryData = queryState?.data;
    if (!equal(state || null, queryData || null)) {
      setState(queryData);
    }
  }, [queryId]);
  const unsubscribe = store.watchQuery<Data>(queryId).subscribe(listener);

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
  const { store } = useMoon();
  const readQueriesResults = () => {
    return currentQueriesIds.reduce<QueriesResults<Data>>((result, queryId) => {
      const queryState = getAdaptedQueryState<Data>(store, queryId);
      result[queryId] = queryState?.data;
      return result;
    }, {});
  };
  const [states, setStates] = React.useState<QueriesResults<Data>>(readQueriesResults());

  const getListener = React.useCallback(
    (queryId: string) => () => {
      const queryState = getAdaptedQueryState<Data>(store, queryId);
      const queryData = queryState?.data;
      if (!equal(states[queryId] || null, queryData || null)) {
        setStates({ [queryId]: queryData });
      }
    },
    [currentQueriesIds]
  );
  const unsubscribeList = queriesIds.map(queryId => store.watchQuery<Data>(queryId).subscribe(getListener(queryId)));

  React.useEffect(() => {
    return () => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
    };
  }, [currentQueriesIds]);

  return resultsToProps ? resultsToProps(states) : states;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state: QueryState<Data, unknown>) => Props
): QueryState<Data, unknown> | Props | undefined {
  const { store } = useMoon();
  const initialSate = getAdaptedQueryState<Data>(store, queryId);
  const [state, setState] = React.useState<QueryState<Data, unknown> | undefined>(initialSate);

  const listener = React.useCallback(() => {
    const newState = getAdaptedQueryState<Data>(store, queryId);
    if (!equal(state || null, newState || null)) {
      setState(newState);
    }
  }, [queryId]);
  const unsubscribe = store.watchQuery(queryId).subscribe(listener);

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
  const { store } = useMoon();
  const readQueriesStates = () => {
    return currentQueriesIds.reduce<QueriesStates>((result, queryId) => {
      result[queryId] = getAdaptedQueryState(store, queryId);
      return result;
    }, {});
  };
  const [states, setStates] = React.useState<QueriesStates>(readQueriesStates());

  const getListener = React.useCallback(
    (queryId: string) => () => {
      const newState = getAdaptedQueryState(store, queryId);
      if (!equal(states[queryId] || null, newState || null)) {
        setStates({ [queryId]: newState });
      }
    },
    [currentQueriesIds]
  );
  const unsubscribeList = queriesIds.map(queryId => store.watchQuery<unknown>(queryId).subscribe(getListener(queryId)));

  React.useEffect(() => {
    return () => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
    };
  }, [currentQueriesIds]);

  return statesToProps ? statesToProps(states) : states;
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
