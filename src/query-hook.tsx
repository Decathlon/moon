import * as React from "react";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";
import { createSelector } from "reselect";
import { useSelector, shallowEqual } from "react-redux";

import { FetchPolicy, MoonNetworkStatus, IQueryActions } from "./query";
import { Nullable } from "./typing";
import { useMoonClient } from "./moonClient";
import { IAppWithMoonStore, IQueriesResult } from "./redux/reducers";

export interface QueriesIds {
  // queryId: prop name
  [queryId: string]: string;
}

export interface IQueryHookResponse<QueryData = any> {
  data?: Nullable<QueryData>;
  loading: boolean;
  error: any;
  networkStatus: MoonNetworkStatus;
}

export interface IQueryHooksProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id?: Nullable<string>;
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

export default function useQuery<QueryData = any, QueryVariables = any, DeserializedData = QueryData>({
  id = null,
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
}: IQueryHooksProps<QueryData, QueryVariables, DeserializedData>): [IQueryHookResponse<DeserializedData>, IQueryActions] {
  const { client } = useMoonClient();
  const [error, setError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<DeserializedData | undefined>(undefined);
  const [networkStatus, setNetworkStatus] = React.useState<MoonNetworkStatus>(MoonNetworkStatus.Ready);
  const isInitialMount = React.useRef(true);
  const cancelSourceRef = React.useRef<CancelTokenSource>();
  const queryId = client && client.getQueryId(id, source, endPoint, variables);
  const cache = useSelector<IAppWithMoonStore, DeserializedData>(
    (state: IAppWithMoonStore) => queryId && state.queriesResult[queryId]
  );
  const useCache = React.useMemo(() => [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy), [
    fetchPolicy
  ]);

  React.useEffect(() => {
    if ((useCache || networkStatus === MoonNetworkStatus.Finished) && data !== cache) {
      setData(cache);
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
  }, [variables, endPoint, source]);

  const cancel = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
      setLoading(false);
      setNetworkStatus(MoonNetworkStatus.Finished);
    }
  };

  const fetch = async () => {
    // @ts-ignore API context initialized to null
    const response: DeserializedData = useCache ? cache : null;
    setError(null);
    setData(response);
    if (response && FetchPolicy.CacheFirst === fetchPolicy) {
      setLoading(false);
      setNetworkStatus(MoonNetworkStatus.Finished);
      if (onResponse) {
        onResponse(response);
      }
    } else {
      setLoading(true);
      setNetworkStatus(MoonNetworkStatus.Fetch);
      try {
        // @ts-ignore API context initialized to null
        const deserializedResponse: DeserializedData = await client.query(id, source, endPoint, variables, deserialize, {
          ...options,
          cancelToken: cancelSourceRef.current && cancelSourceRef.current.token
        });
        setLoading(false);
        setData(deserializedResponse);
        setNetworkStatus(MoonNetworkStatus.Finished);
        if (onResponse) {
          onResponse(deserializedResponse);
        }
      } catch (err) {
        if (StaticAxios.isCancel(err)) {
          return;
        }
        setLoading(false);
        setError(err);
        setNetworkStatus(MoonNetworkStatus.Finished);
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
