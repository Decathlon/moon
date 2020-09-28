import * as React from "react";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { useQuery as useReactQuery, QueryResult, QueryConfig, useQueryCache } from "react-query";

import { useMoon } from "./hooks";
import { getQueryId } from "./utils";

export enum FetchPolicy {
  // always try reading data from your cache first
  CacheFirst = "cache-first",
  // first trying to read data from your cache
  CacheAndNetwork = "cache-and-network",
  // never return you initial data from the cache
  NetworkOnly = "network-only"
}

export type IQueryResultProps<QueryData, DeserializedData = QueryData> = [
  Pick<QueryResult<AxiosResponse<QueryData | DeserializedData>>, "clear" | "fetchMore" | "refetch" | "remove">,
  Omit<QueryResult<AxiosResponse<QueryData | DeserializedData>>, "clear" | "fetchMore" | "refetch" | "remove">
];

export interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id?: string;
  source: string;
  endPoint: string;
  variables: QueryVariables;
  fetchPolicy?: FetchPolicy;
  options?: AxiosRequestConfig;
  deserialize?: (data: QueryData) => DeserializedData;
  queryConfig?: QueryConfig<AxiosResponse<QueryData | DeserializedData>>;
}

export default function useQuery<QueryData = any, QueryVariables = any, DeserializedData = QueryData>({
  id,
  source,
  endPoint,
  variables,
  options,
  deserialize,
  fetchPolicy = FetchPolicy.CacheAndNetwork,
  queryConfig
}: IQueryProps<QueryData, QueryVariables, DeserializedData>): IQueryResultProps<QueryData, DeserializedData> {
  const { client } = useMoon();
  const queryKey = getQueryId(id, source, endPoint, variables);
  const isInitialMount = React.useRef<boolean>(true);
  const cache = useQueryCache();
  const cachedResult = cache.getQueryData<AxiosResponse<QueryData | DeserializedData>>(queryKey);
  const cacheOnly = fetchPolicy === FetchPolicy.CacheFirst;
  const networkOnly = fetchPolicy === FetchPolicy.NetworkOnly;
  const useCache = fetchPolicy === FetchPolicy.CacheAndNetwork || cacheOnly;

  if (isInitialMount.current && networkOnly) {
    cache.getQuery(queryKey)?.remove();
  }

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  function fetch() {
    return cacheOnly && cachedResult
      ? cachedResult
      : client.query<QueryData, DeserializedData, QueryVariables>(source, endPoint, variables, deserialize, {
          ...options
        });
  }

  const queryResult = useReactQuery<AxiosResponse<QueryData | DeserializedData>>(queryKey, fetch, {
    ...queryConfig,
    initialData: useCache ? cachedResult || queryConfig?.initialData : queryConfig?.initialData,
    cacheTime: networkOnly ? 0 : queryConfig?.cacheTime
  });

  const { clear, fetchMore, refetch, remove, ...others } = queryResult;
  return [{ clear, fetchMore, refetch, remove }, others];
}
