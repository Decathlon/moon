import shallowEqual from "./utils/shallow-equal";
import { Nullable } from "./typing";

export enum MoonNetworkStatus {
  Ready = 1,
  Fetch = 2,
  Finished = 3
}

export interface QueryState<Data = any> {
  loading: boolean;
  error: any;
  networkStatus: MoonNetworkStatus;
  data?: Data;
}

export type OnStateChangeHandler<Data = any> = (state: QueryState<Data>) => void;
export type OnResultChangeHandler<Data = any> = (data: Data) => void;

interface Query<Data = any> {
  id: string;
  state: QueryState<Data>;
  onStateChangeHandlers: OnStateChangeHandler<Data>[];
  onResultChangeHandlers: OnResultChangeHandler<Data>[];
}

export interface Queries<Datas = any> {
  [queryId: string]: Query<Datas>;
}

export interface QieriesStates<Datas = any> {
  [queryId: string]: QueryState<Datas>;
}

export interface QueriesResults<Data = any> {
  [queryId: string]: Data;
}

export const getDefaultQuery = (queryId: string): Query => {
  const defaultQueryState = {
    loading: false,
    error: null,
    networkStatus: MoonNetworkStatus.Ready,
    data: undefined
  };
  return {
    id: queryId,
    state: defaultQueryState,
    onStateChangeHandlers: [],
    onResultChangeHandlers: []
  };
};

export class Store {
  private queries: Queries;

  constructor(initialStore: Queries = {}) {
    this.queries = initialStore;
  }

  public subscribeToQueryResult = (queryId: string, onResultChangeHandler: OnResultChangeHandler) => {
    const currentQuery = this.queries[queryId] || getDefaultQuery(queryId);
    if (currentQuery.onResultChangeHandlers.indexOf(onResultChangeHandler) < 0) {
      currentQuery.onResultChangeHandlers.push(onResultChangeHandler);
      this.queries[queryId] = currentQuery;
    }
  };

  public unsubscribeFromQueryResult = (queryId: string, onResultChangeHandler: OnResultChangeHandler) => {
    const currentQuery = this.queries[queryId];
    if (currentQuery) {
      const { onResultChangeHandlers } = currentQuery;
      onResultChangeHandlers.splice(onResultChangeHandlers.indexOf(onResultChangeHandler), 1);
    }
  };

  public subscribeToQuery = (queryId: string, onStateChangeHandler: OnStateChangeHandler) => {
    const currentQuery = this.queries[queryId] || getDefaultQuery(queryId);
    if (currentQuery.onStateChangeHandlers.indexOf(onStateChangeHandler) < 0) {
      currentQuery.onStateChangeHandlers.push(onStateChangeHandler);
      this.queries[queryId] = currentQuery;
    }
  };

  public unsubscribeFromQuery = (queryId: string, onStateChangeHandler: OnStateChangeHandler) => {
    const currentQuery = this.queries[queryId];
    if (currentQuery) {
      const { onStateChangeHandlers } = currentQuery;
      onStateChangeHandlers.splice(onStateChangeHandlers.indexOf(onStateChangeHandler), 1);
    }
  };

  public setQueryState = (queryId: string, queryState: Partial<QueryState>) => {
    const currentQuery = this.queries[queryId] || getDefaultQuery(queryId);
    const newState = { ...currentQuery.state, ...queryState };
    if (!shallowEqual(newState, currentQuery.state)) {
      currentQuery.onStateChangeHandlers.forEach(onStateChangeHandler => {
        onStateChangeHandler(newState);
      });
      if (!shallowEqual(newState.data, currentQuery.state.data)) {
        currentQuery.onResultChangeHandlers.forEach(onResultChangeHandler => {
          onResultChangeHandler(newState.data);
        });
      }
      currentQuery.state = newState;
    }
    this.queries[queryId] = currentQuery;
  };

  public writeQuery = (queryId: string, data: any) => {
    const currentQuery = this.queries[queryId] || getDefaultQuery(queryId);
    this.queries[queryId] = currentQuery;
    const newState = { ...currentQuery.state, data };
    this.setQueryState(queryId, newState);
  };

  public readQuery = <Data = any>(queryId: string) => {
    const currentQuery = this.queries[queryId] || getDefaultQuery(queryId);
    this.queries[queryId] = currentQuery;
    return currentQuery.state as QueryState<Data>;
  };

  public getQueries = () => {
    return this.queries;
  };
}

let store: Nullable<Store> = null;

export function createMoonStore(initialStore?: Queries) {
  store = new Store(initialStore);
  return store;
}

export default function getMoonStore(initialStore?: Queries) {
  if (!store) {
    store = createMoonStore(initialStore);
  }

  return store;
}
