import * as React from "react";

import { QueryState, QueriesStates, QueriesResults } from "./store";
import shallowEqual from "./utils/shallow-equal";
import { MoonContext, RquiredMoonContextValue } from "./moon-provider";

export interface ResultProps {
  [propName: string]: any;
}

export function useQueryResult<Data = any, Props = ResultProps>(
  queryId: string,
  resultToProps?: (state?: Data) => Props
): Data | Props | undefined {
  const { store } = useMoon();
  const queryResult = store.readQuery<Data>(queryId).data;
  const [state, setState] = React.useState<Data | undefined>(queryResult);
  store.subscribeToQueryResult(queryId, setState);

  React.useEffect(() => {
    return () => store.unsubscribeFromQueryResult(queryId, setState);
  }, [queryId]);

  return resultToProps ? resultToProps(state) : state;
}

export function useQueriesResults<Data = any, Props = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults<Data>) => Props
): QueriesResults<Data> | Props {
  const { store } = useMoon();
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queriesStates = currentQueriesIds.reduce<QueriesResults<Data>>((result, queryId) => {
    result[queryId] = store.readQuery<Data>(queryId).data;
    return result;
  }, {});
  const [states, setStates] = React.useState<QueriesResults<Data>>(queriesStates);
  const setState = (queryId: string) => (result: Data) => {
    setStates({ ...states, [queryId]: result });
  };

  const queriesHandlers = React.useMemo(
    () =>
      currentQueriesIds.reduce((handlers, queryId) => {
        handlers[queryId] = setState(queryId);
        return handlers;
      }, {}),
    [currentQueriesIds]
  );
  const { prevValue: prevQueriesHandlers } = usePrevValue(queriesHandlers);

  React.useEffect(() => {
    currentQueriesIds.forEach(queryId => {
      store.subscribeToQueryResult(queryId, queriesHandlers[queryId]);
    });
    return () =>
      queriesIds.forEach(queryId => {
        store.unsubscribeFromQueryResult(queryId, prevQueriesHandlers[queryId]);
      });
  }, [currentQueriesIds]);

  return resultsToProps ? resultsToProps(states) : states;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state: QueryState<Data>) => Props
): QueryState<Data> | Props {
  const { store } = useMoon();
  const queryState = store.readQuery(queryId) as QueryState<Data>;
  const [state, setState] = React.useState<QueryState<Data>>(queryState);
  store.subscribeToQuery(queryId, setState);

  React.useEffect(() => {
    return () => store.unsubscribeFromQuery(queryId, setState);
  }, [queryId]);

  return stateToProps ? stateToProps(state) : state;
}

export function useQueriesStates<Data = any, Props = ResultProps>(
  queriesIds: string[],
  statesToProps?: (states: QueriesStates<Data>) => Props
): QueriesStates<Data> | Props {
  const { store } = useMoon();
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queriesStates = currentQueriesIds.reduce<QueriesStates<Data>>((result, queryId) => {
    result[queryId] = store.readQuery(queryId);
    return result;
  }, {});
  const [states, setStates] = React.useState<QueriesStates<Data>>(queriesStates);
  const setState = (queryId: string) => (state: QueryState<Data>) => {
    setStates({ ...states, [queryId]: state });
  };

  const queriesHandlers = React.useMemo(
    () =>
      currentQueriesIds.reduce((handlers, queryId) => {
        handlers[queryId] = setState(queryId);
        return handlers;
      }, {}),
    [currentQueriesIds]
  );
  const { prevValue: prevQueriesHandlers } = usePrevValue(queriesHandlers);

  React.useEffect(() => {
    currentQueriesIds.forEach(queryId => {
      store.subscribeToQuery(queryId, queriesHandlers[queryId]);
    });
    return () =>
      queriesIds.forEach(queryId => {
        store.unsubscribeFromQuery(queryId, prevQueriesHandlers[queryId]);
      });
  }, [currentQueriesIds]);

  return statesToProps ? statesToProps(states) : states;
}

export function usePrevValue<Value = any>(value: Value) {
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
  const { client, store } = moonContext;
  if (!client || !store) {
    throw new Error("Invariant Violation: Please wrap the root component in a <MoonProvider>");
  }
  return moonContext as RquiredMoonContextValue;
}
