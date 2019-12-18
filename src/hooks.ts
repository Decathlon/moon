import * as React from "react";

import { MoonContext } from "./moon-provider";
import { QueryState, QieriesStates, QueriesResults } from "./store";
import shallowEqual from "./utils/shallow-equal";

export interface ResultProps {
  [propName: string]: any;
}

export function useQueryResult<Data = any, Props = ResultProps>(
  queryId: string,
  resultToProps?: (state?: Data) => Props
): Data | Props | undefined {
  const { store } = React.useContext(MoonContext);
  //@ts-ignore can't be undefined
  const queryResult = store.readQuery<Data>(queryId).data;
  const [state, setState] = React.useState<Data | undefined>(queryResult);
  //@ts-ignore can't be undefined
  store?.subscribeToQueryResult(queryId, setState);

  React.useEffect(() => {
    //@ts-ignore can't be undefined
    return () => store?.unsubscribeFromQueryResult(queryId, setState);
  }, [queryId]);

  return resultToProps ? resultToProps(state) : state;
}

export function useQueriesResults<Data = any, Props = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults<Data>) => Props
): QueriesResults<Data> | Props {
  const { store } = React.useContext(MoonContext);
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queriesStates = currentQueriesIds.reduce<QueriesResults<Data>>((result, queryId) => {
    //@ts-ignore can't be undefined
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
      //@ts-ignore can't be undefined
      store?.subscribeToQueryResult(queryId, queriesHandlers[queryId]);
    });
    return () =>
      queriesIds.forEach(queryId => {
        //@ts-ignore can't be undefined
        store?.unsubscribeFromQueryResult(queryId, prevQueriesHandlers[queryId]);
      });
  }, [currentQueriesIds]);

  return resultsToProps ? resultsToProps(states) : states;
}

export function useQueryState<Data = any, Props = ResultProps>(
  queryId: string,
  stateToProps?: (state: QueryState<Data>) => Props
): QueryState<Data> | Props {
  const { store } = React.useContext(MoonContext);
  //@ts-ignore can't be undefined
  const queryState = store.readQuery(queryId);
  const [state, setState] = React.useState<QueryState<Data>>(queryState);
  //@ts-ignore can't be undefined
  store.subscribeToQuery(queryId, setState);

  React.useEffect(() => {
    //@ts-ignore can't be undefined
    return () => store.unsubscribeFromQuery(queryId, setState);
  }, [queryId]);

  return stateToProps ? stateToProps(state) : state;
}

export function useQueriesStates<Data = any, Props = ResultProps>(
  queriesIds: string[],
  statesToProps?: (states: QieriesStates<Data>) => Props
): QieriesStates<Data> | Props {
  const { store } = React.useContext(MoonContext);
  const { value: currentQueriesIds } = usePrevValue(queriesIds);
  const queriesStates = currentQueriesIds.reduce<QieriesStates<Data>>((result, queryId) => {
    //@ts-ignore can't be undefined
    result[queryId] = store.readQuery(queryId);
    return result;
  }, {});
  const [states, setStates] = React.useState<QieriesStates<Data>>(queriesStates);
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
      //@ts-ignore can't be undefined
      store.subscribeToQuery(queryId, queriesHandlers[queryId]);
    });
    return () =>
      queriesIds.forEach(queryId => {
        //@ts-ignore can't be undefined
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

export function useMoon() {
  return React.useContext(MoonContext);
}
