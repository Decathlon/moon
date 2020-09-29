import * as React from "react";
import { useQuery as useReactQuery, QueryResult, QueryConfig as ReactQueryConfig } from "react-query";

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

export type IQueryResultProps<QueryResponse> = [
  Pick<QueryResult<QueryResponse>, "clear" | "fetchMore" | "refetch" | "remove">,
  Omit<QueryResult<QueryResponse>, "clear" | "fetchMore" | "refetch" | "remove">
];

export interface IQueryProps<QueryVariables = any, QueryConfig = any, QueryResponse = any> {
  id?: string;
  source: string;
  endPoint: string;
  variables: QueryVariables;
  fetchPolicy?: FetchPolicy;
  options?: QueryConfig;
  queryConfig?: ReactQueryConfig<QueryResponse>;
}

export default function useQuery<QueryVariables = any, QueryConfig = any, QueryResponse = any>({
  id,
  source,
  endPoint,
  variables,
  options,
  fetchPolicy = FetchPolicy.CacheAndNetwork,
  queryConfig
}: IQueryProps<QueryVariables, QueryConfig, QueryResponse>): IQueryResultProps<QueryResponse> {
  const { client } = useMoon();
  const isInitialMount = React.useRef<boolean>(true);
  const { store } = useMoon();
  const queryKey = getQueryId(id, source, endPoint, variables);
  const cachedResult = store.getQueryData<QueryResponse>(queryKey);
  const cacheOnly = fetchPolicy === FetchPolicy.CacheFirst;
  const networkOnly = fetchPolicy === FetchPolicy.NetworkOnly;
  const useCache = fetchPolicy === FetchPolicy.CacheAndNetwork || cacheOnly;

  if (isInitialMount.current && networkOnly) {
    store.getQuery(queryKey)?.remove();
  }

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  function fetch() {
    return cacheOnly && cachedResult
      ? cachedResult
      : client.query<QueryVariables, QueryConfig, QueryResponse>(source, endPoint, variables, options);
  }

  const queryResult = useReactQuery<QueryResponse>(queryKey, fetch, {
    ...queryConfig,
    initialData: useCache ? cachedResult || queryConfig?.initialData : queryConfig?.initialData,
    cacheTime: networkOnly ? 0 : queryConfig?.cacheTime,
    retryDelay: networkOnly ? 0 : queryConfig?.retryDelay
  });

  const { clear, fetchMore, refetch, remove, ...others } = queryResult;
  return [{ clear, fetchMore, refetch, remove }, others];
}
