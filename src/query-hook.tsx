import * as React from "react";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";

import { usePrevValue, useMoon, useQueryState } from "./hooks";
import { QueryState, MoonNetworkStatus } from "./store";
import { getQueryId } from "./utils";

export interface QueriesIds {
  // queryId: prop name
  [queryId: string]: string;
}

export enum FetchPolicy {
  // always try reading data from your cache first
  CacheFirst = "cache-first",
  // first trying to read data from your cache
  CacheAndNetwork = "cache-and-network",
  // never return you initial data from the cache
  NetworkOnly = "network-only"
}

export interface IQueryActions {
  refetch: () => void;
  cancel: () => void;
}

export interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id?: string;
  source: string;
  endPoint: string;
  variables?: QueryVariables;
  fetchOnMount?: boolean;
  autoRefetchOnUpdate?: boolean;
  fetchPolicy?: FetchPolicy;
  options?: AxiosRequestConfig;
  deserialize?: (response: QueryData) => DeserializedData;
  onResponse?: (response: DeserializedData) => void;
  onError?: (error: any) => void;
}

export interface IQueryState<QueryData = any> extends QueryState {
  data?: QueryData;
}

export default function useQuery<QueryData = any, QueryVariables = any, DeserializedData = QueryData>({
  id,
  source,
  endPoint,
  options,
  variables,
  fetchPolicy = FetchPolicy.CacheAndNetwork,
  deserialize,
  onResponse,
  onError,
  fetchOnMount = true,
  autoRefetchOnUpdate = true
}: IQueryProps<QueryData, QueryVariables, DeserializedData>): [IQueryState<DeserializedData>, IQueryActions] {
  const { client, store } = useMoon();
  const isInitialMount = React.useRef(true);
  const cancelSourceRef = React.useRef<CancelTokenSource>();
  const { value: currentVariables, prevValue: prevVariables } = usePrevValue(variables);
  const queryId = React.useMemo(() => getQueryId(id, source, endPoint, variables), [client, id, source, endPoint, variables]);
  const state = useQueryState<DeserializedData>(queryId) as QueryState<DeserializedData>;
  const { data, loading, error, networkStatus } = state;

  React.useEffect(() => {
    cancelSourceRef.current = StaticAxios.CancelToken.source();
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (fetchOnMount) {
        fetch();
      }
    } else if (autoRefetchOnUpdate) {
      fetch();
    }
    // @ts-ignore cancelSourceRef.current can't be undefined
    return () => cancelSourceRef.current.cancel();
  }, [currentVariables, endPoint, source]);

  const cancel = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
      store.setQueryState(queryId, { ...state, loading: false, networkStatus: MoonNetworkStatus.Finished });
    }
  };

  const fetch = async () => {
    if (data && currentVariables === prevVariables && FetchPolicy.CacheFirst === fetchPolicy) {
      store.setQueryState(queryId, { ...state, loading: false, networkStatus: MoonNetworkStatus.Finished, error: null });
      if (onResponse) {
        onResponse(data);
      }
    } else {
      const reponse = FetchPolicy.NetworkOnly === fetchPolicy ? undefined : data;
      store.setQueryState(queryId, {
        ...state,
        loading: true,
        networkStatus: MoonNetworkStatus.Fetch,
        error: null,
        data: reponse
      });
      try {
        const deserializedResponse: DeserializedData = await client.query(source, endPoint, variables, deserialize, {
          ...options,
          cancelToken: cancelSourceRef.current && cancelSourceRef.current.token
        });
        store.setQueryState(queryId, {
          ...state,
          error: null,
          data: deserializedResponse,
          loading: false,
          networkStatus: MoonNetworkStatus.Finished
        });
        if (onResponse) {
          onResponse(deserializedResponse);
        }
      } catch (err) {
        if (StaticAxios.isCancel(err)) {
          return;
        }
        store.setQueryState(queryId, { ...state, loading: false, networkStatus: MoonNetworkStatus.Finished, error: err });
        if (onError) {
          onError(err);
        }
      }
    }
  };
  return [
    { loading, data, error, networkStatus },
    { refetch: fetch, cancel }
  ];
}
