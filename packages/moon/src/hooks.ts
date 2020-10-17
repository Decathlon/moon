import * as React from "react";
import { QueryClient, QueryObserver, QueriesObserver, hashQueryKey } from "react-query";
import { Query, QueryState } from "react-query/types/core/query";

import { MoonContext, RquiredMoonContextValue } from "./moon-provider";
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

// cacheTime=0 not working
export function getAdaptedQueryState<Data>(store: QueryClient, queryId: string): QueryState<Data, unknown> | undefined {
  const query = store.getQueryCache().get<Data>(hashQueryKey(queryId));
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
  const isMounted = useIsMounted();
  const queryState = getAdaptedQueryState<Data>(store, queryId);
  const queryResult = queryState?.data;
  const [state, setState] = React.useState<Data | undefined>(queryResult);

  const observerRef = React.useRef<QueryObserver<Data>>();
  const firstRender = !observerRef.current;
  const defaultOptions = React.useMemo(() => store.defaultQueryObserverOptions({ queryKey: queryId }), [queryId]);
  const observer = observerRef.current || new QueryObserver<Data>(store, defaultOptions);
  observerRef.current = observer;

  if (!firstRender) {
    observer.setOptions(defaultOptions);
  }

  const listener = React.useCallback(() => {
    if (isMounted()) {
      const queryState = getAdaptedQueryState<Data>(store, queryId);
      const queryData = queryState?.data;
      if (!equal(state || null, queryData || null)) {
        setState(queryData);
      }
    }
  }, [queryId]);

  React.useEffect(() => {
    return observer.subscribe(listener);
  }, [queryId]);

  return resultToProps ? resultToProps(state) : state;
}

export function useQueriesResults<Data = any, Props = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults<Data>) => Props
): QueriesResults<Data> | Props {
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const { store } = useMoon();
  const isMounted = useIsMounted();

  const queriesResults = React.useMemo(() => {
    return currentQueriesIds.reduce<QueriesResults<Data>>((result, queryId) => {
      const queryState = getAdaptedQueryState<Data>(store, queryId);
      result[queryId] = queryState?.data;
      return result;
    }, {});
  }, [currentQueriesIds, store]);

  const [states, setStates] = React.useState<QueriesResults<Data>>(queriesResults);

  const queries = React.useMemo(() => {
    return queriesIds.map(queryId => store.defaultQueryObserverOptions({ queryKey: queryId }));
  }, [currentQueriesIds]);
  const observerRef = React.useRef<QueriesObserver>();
  const firstRender = !observerRef.current;
  const observer = observerRef.current || new QueriesObserver(store, queries);
  observerRef.current = observer;

  if (!firstRender) {
    observer.setQueries(queries);
  }

  const listener = React.useCallback(() => {
    if (isMounted()) {
      queriesIds.forEach(queryId => {
        const queryState = getAdaptedQueryState<Data>(store, queryId);
        const queryData = queryState?.data;
        if (!equal(states[queryId] || null, queryData || null)) {
          setStates({ [queryId]: queryData });
        }
      });
    }
  }, [currentQueriesIds]);

  React.useEffect(() => {
    return observer.subscribe(listener);
  }, [currentQueriesIds]);

  return resultsToProps ? resultsToProps(states) : states;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state: QueryState<Data, unknown>) => Props
): QueryState<Data, unknown> | Props | undefined {
  const { store } = useMoon();
  const isMounted = useIsMounted();
  const initialSate = getAdaptedQueryState<Data>(store, queryId);
  const [state, setState] = React.useState<QueryState<Data, unknown> | undefined>(initialSate);

  const observerRef = React.useRef<QueryObserver<Data>>();
  const firstRender = !observerRef.current;
  const defaultOptions = React.useMemo(() => store.defaultQueryObserverOptions({ queryKey: queryId }), [queryId]);
  const observer = observerRef.current || new QueryObserver<Data>(store, defaultOptions);
  observerRef.current = observer;

  if (!firstRender) {
    observer.setOptions(defaultOptions);
  }

  const listener = React.useCallback(() => {
    if (isMounted()) {
      const newState = getAdaptedQueryState<Data>(store, queryId);
      if (!equal(state || null, newState || null)) {
        setState(newState);
      }
    }
  }, [queryId]);

  React.useEffect(() => {
    return observer.subscribe(listener);
  }, [queryId]);

  return stateToProps && state ? stateToProps(state) : state;
}

export function useQueriesStates<Props = ResultProps>(
  queriesIds: string[],
  statesToProps?: (states: QueriesStates) => Props
): QueriesStates | Props {
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const { store } = useMoon();
  const isMounted = useIsMounted();
  const queriesStates = React.useMemo(() => {
    return currentQueriesIds.reduce<QueriesStates>((result, queryId) => {
      result[queryId] = getAdaptedQueryState(store, queryId);
      return result;
    }, {});
  }, [currentQueriesIds, store]);
  const [states, setStates] = React.useState<QueriesStates>(queriesStates);

  const queries = React.useMemo(() => {
    return queriesIds.map(queryId => store.defaultQueryObserverOptions({ queryKey: queryId }));
  }, [currentQueriesIds]);
  const observerRef = React.useRef<QueriesObserver>();
  const firstRender = !observerRef.current;
  const observer = observerRef.current || new QueriesObserver(store, queries);
  observerRef.current = observer;

  if (!firstRender) {
    observer.setQueries(queries);
  }

  const listener = React.useCallback(() => {
    if (isMounted()) {
      queriesIds.forEach(queryId => {
        const newState = getAdaptedQueryState(store, queryId);
        if (!equal(states[queryId] || null, newState || null)) {
          setStates({ [queryId]: newState });
        }
      });
    }
  }, [currentQueriesIds]);

  React.useEffect(() => {
    return observer.subscribe(listener);
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
