import * as React from "react";
import { AxiosRequestConfig } from "axios";
import { createSelector } from "reselect";
import { useSelector, shallowEqual } from "react-redux";

import { FetchPolicy, MoonNetworkStatus } from "./query";
import { Nullable } from "./typing";
import { useMoonClient } from "./moonClient";
import { IAppWithMoonStore, IQueriesResult } from "./redux/reducers";

interface QueriesIds {
  // queryId: prop name
  [queryId: string]: string;
}

interface IActions {
  refetch: () => void;
}

interface IQueryResponse<QueryData = any> {
  data?: Nullable<QueryData>;
  loading: boolean;
  error: any;
  networkStatus: MoonNetworkStatus;
}

export interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
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
}: IQueryProps<QueryData, QueryVariables, DeserializedData>): [IQueryResponse<DeserializedData>, IActions] {
  const { client } = useMoonClient();
  const [error, setError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<DeserializedData | undefined>(undefined);
  const [networkStatus, setNetworkStatus] = React.useState<MoonNetworkStatus>(MoonNetworkStatus.Ready);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (fetchOnMount) {
        fetch();
      }
    } else if (autoRefetchOnUpdate) {
      fetch();
    }
  }, [variables, endPoint, source]);

  const useCache = React.useMemo(() => [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy), [
    fetchPolicy
  ]);

  const fetch = async () => {
    // @ts-ignore API context initialized to null
    const response: DeserializedData = useCache ? client.readQuery(id, source, endPoint, variables) : null;
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
        const deserializedResponse: DeserializedData = await client.query(id, source, endPoint, variables, deserialize, options);
        setLoading(false);
        setData(deserializedResponse);
        setNetworkStatus(MoonNetworkStatus.Finished);
        if (onResponse) {
          onResponse(deserializedResponse);
        }
      } catch (err) {
        setLoading(false);
        setError(err);
        setNetworkStatus(MoonNetworkStatus.Finished);
        if (onError) {
          onError(err);
        }
      }
    }
  };
  return [{ loading, data, error, networkStatus }, { refetch: fetch }];
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
