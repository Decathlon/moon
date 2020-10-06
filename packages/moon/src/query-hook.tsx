import * as React from "react";
import { useQuery as useReactQuery, QueryResult, QueryConfig as ReactQueryConfig } from "react-query";

import { useMoon, usePrevValue } from "./hooks";
import { ClientConfig, getId } from "./utils";

export enum FetchPolicy {
  // always try reading data from your cache first
  CacheFirst = "cache-first",
  // first trying to read data from your cache
  CacheAndNetwork = "cache-and-network",
  // never return you initial data from the cache
  NetworkOnly = "network-only"
}

export type IQueryResultProps<QueryResponse, QueryError> = [
  Pick<QueryResult<QueryResponse, QueryError>, "clear" | "fetchMore" | "refetch" | "remove"> & { cancel: () => void },
  Omit<QueryResult<QueryResponse, QueryError>, "clear" | "fetchMore" | "refetch" | "remove">
];

export interface IQueryProps<QueryVariables = any, QueryResponse = any, QueryError = any, QueryConfig = any> {
  id?: string;
  /** The Link id of the http client. */
  source?: string;
  /** The REST end point. */
  endPoint?: string;
  /** The variables of your query. */
  variables?: QueryVariables;
  /**
   * The fetch policy is an option which allows you to
   * specify how you want your component to interact with
   * the Moon data cache. Default value: FetchPolicy.CacheAndNetwork */
  fetchPolicy?: FetchPolicy;
  /** The http client options of your query. */
  options?: QueryConfig;
  /** The react-query config. Please see the react-query QueryConfig for more details. */
  queryConfig?: ReactQueryConfig<QueryResponse, QueryError>;
}

export const getQueryId = (queryProps: Pick<IQueryProps, "id" | "source" | "endPoint" | "variables" | "options">): string => {
  return getId(queryProps);
};

export default function useQuery<
  QueryVariables = any,
  QueryResponse = any,
  QueryError = any,
  QueryConfig extends ClientConfig = any
>({
  id,
  source,
  endPoint,
  variables,
  options,
  fetchPolicy = FetchPolicy.CacheAndNetwork,
  queryConfig
}: IQueryProps<QueryVariables, QueryResponse, QueryError, QueryConfig>): IQueryResultProps<QueryResponse, QueryError> {
  const { client, store } = useMoon();
  const isInitialMount = React.useRef<boolean>(true);
  const clientProps = { source, endPoint, variables, options };
  const queryId = getQueryId({ id, ...clientProps });
  const { value, prevValue } = usePrevValue({ queryId, clientProps });
  const resolvedQueryConfig = React.useMemo(() => store.getResolvedQueryConfig(queryId, queryConfig), [
    store,
    queryId,
    queryConfig
  ]);

  const cacheOnly = fetchPolicy === FetchPolicy.CacheFirst;
  const networkOnly = fetchPolicy === FetchPolicy.NetworkOnly;

  if (isInitialMount.current && networkOnly) {
    // remove cache if networkOnly
    store.setQueryData(queryId, queryConfig?.initialData);
  }

  function cancel() {
    store.cancelQueries(queryId, { exact: true });
  }

  function fetch() {
    const cachedResult = store.getQueryData<QueryResponse>(queryId);
    return cacheOnly && cachedResult
      ? cachedResult
      : client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, variables, options);
  }

  const queryResult = useReactQuery<QueryResponse, QueryError>(queryId, fetch, {
    ...queryConfig,
    cacheTime: networkOnly ? 0 : queryConfig?.cacheTime,
    // default values to false
    refetchOnReconnect: queryConfig?.refetchOnReconnect || false,
    refetchOnWindowFocus: queryConfig?.refetchOnWindowFocus || false
  });

  const { clear, fetchMore, refetch, remove, ...others } = queryResult;

  React.useEffect(() => {
    if (prevValue.queryId === value.queryId && !isInitialMount.current && resolvedQueryConfig?.enabled) {
      // refetch on update and when only client options have been changed
      refetch();
    }
  }, [value.clientProps]);

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  return [{ clear, fetchMore, refetch, remove, cancel }, others];
}
