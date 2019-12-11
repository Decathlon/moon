import * as React from "react";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";
import { createSelector } from "reselect";
import { useSelector, shallowEqual } from "react-redux";

import { useMoonClient } from "./moonClient";
import { IAppWithMoonStore, IQueriesResult } from "./redux/reducers";
import { usePrevValue } from "./utils";

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

export enum MoonNetworkStatus {
  Ready = 1,
  Fetch = 2,
  Finished = 3
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

export interface IQueryState<QueryData = any> {
  loading: boolean;
  error: any;
  data?: QueryData;
  networkStatus: MoonNetworkStatus;
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
  const { client } = useMoonClient();
  const isInitialMount = React.useRef(true);
  const cancelSourceRef = React.useRef<CancelTokenSource>();
  const { value, prevValue } = usePrevValue(variables);
  const queryId = React.useMemo(() => client && client.getQueryId(id, source, endPoint, variables), [
    client,
    id,
    source,
    endPoint,
    variables
  ]);
  const useCache = React.useMemo(() => [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy), [
    fetchPolicy
  ]);
  const cache = useSelector<IAppWithMoonStore, DeserializedData>(
    (state: IAppWithMoonStore) => queryId && state.queriesResult[queryId]
  );
  const [state, setState] = React.useState<IQueryState<DeserializedData>>({
    data: useCache && cache ? cache : undefined,
    loading: false,
    networkStatus: MoonNetworkStatus.Ready,
    error: null
  });
  const { data, loading, error, networkStatus } = state;

  React.useEffect(() => {
    if (data !== cache) {
      if ((networkStatus === MoonNetworkStatus.Ready && useCache) || networkStatus === MoonNetworkStatus.Finished) {
        setState({ ...state, data: cache });
      }

      if (networkStatus === MoonNetworkStatus.Fetch) {
        setState({ ...state, data: cache, loading: false, networkStatus: MoonNetworkStatus.Finished });
      }
    }
  }, [cache]);

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
    // @ts-ignore can't be undefined
    return () => cancelSourceRef.current.cancel();
  }, [value, endPoint, source]);

  const cancel = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
      setState({ ...state, loading: false, networkStatus: MoonNetworkStatus.Finished });
    }
  };

  const fetch = async () => {
    if (data && value === prevValue && FetchPolicy.CacheFirst === fetchPolicy) {
      setState({ ...state, loading: false, networkStatus: MoonNetworkStatus.Finished, error: null });
      if (onResponse) {
        onResponse(data);
      }
    } else {
      setState({ ...state, loading: true, networkStatus: MoonNetworkStatus.Fetch, error: null });
      try {
        // the client.query (see MoonCient.query) will update the cache and consequently the state of this useQuery hook
        // @ts-ignore API context initialized to null
        const deserializedResponse: DeserializedData = await client.query(id, source, endPoint, variables, deserialize, {
          ...options,
          cancelToken: cancelSourceRef.current && cancelSourceRef.current.token
        });
        if (onResponse) {
          onResponse(deserializedResponse);
        }
      } catch (err) {
        if (StaticAxios.isCancel(err)) {
          return;
        }
        setState({ ...state, loading: false, networkStatus: MoonNetworkStatus.Finished, error: err });
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

const selectQueriesResult = createSelector(
  (state: IAppWithMoonStore) => state.queriesResult,
  (_: IAppWithMoonStore, queriesIds: QueriesIds) => queriesIds,
  (queriesResult: IQueriesResult, queriesIds: QueriesIds) =>
    Object.keys(queriesIds).reduce<IQueriesResult>((result, queryId) => {
      result[queriesIds[queryId]] = queriesResult[queryId];
      return result;
    }, {})
);

export function useQueriesResult(queriesIds: QueriesIds) {
  return useSelector<IAppWithMoonStore, IQueriesResult>(
    (state: IAppWithMoonStore) => selectQueriesResult(state, queriesIds),
    shallowEqual
  );
}
