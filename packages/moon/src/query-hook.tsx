import * as React from "react";
import { useQuery as useReactQuery, UseQueryResult, UseQueryOptions as ReactQueryConfig } from "react-query";

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
  Omit<UseQueryResult<QueryResponse, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove">,
  Pick<UseQueryResult<QueryResponse | undefined, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove"> & {
    cancel: () => void;
  }
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
  queryConfig?: ReactQueryConfig<QueryResponse | undefined, QueryError>;
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
  const clientProps = { source, endPoint, variables };
  const queryId = getQueryId({ id, ...clientProps });
  const { value, prevValue } = usePrevValue({ queryId, clientProps });
  const resolvedQueryConfig: ReactQueryConfig<QueryResponse | undefined, QueryError> = React.useMemo(
    () => ({ ...queryConfig, ...store.getQueryDefaults(queryId) }),
    [store, queryId, queryConfig]
  );

  const cacheOnly = fetchPolicy === FetchPolicy.CacheFirst;
  const networkOnly = fetchPolicy === FetchPolicy.NetworkOnly;

  const adaptedQueryConfig: ReactQueryConfig<QueryResponse | undefined, QueryError> = React.useMemo(
    () =>
      store.defaultQueryObserverOptions({
        ...queryConfig,
        // to fix (react-query)
        cacheTime: networkOnly ? 0 : queryConfig?.cacheTime,
        // default values to false
        refetchOnReconnect: queryConfig?.refetchOnReconnect || false,
        refetchOnWindowFocus: queryConfig?.refetchOnWindowFocus || false
      }),
    [queryConfig, networkOnly, store]
  );

  if (isInitialMount.current && networkOnly) {
    // remove cache if networkOnly
    store.setQueryData<QueryResponse | undefined>(queryId, queryConfig?.initialData);
  }

  function cancel() {
    store.cancelQueries(queryId, { exact: true });
  }

  function fetch(_key: string, nextPageProps?: any) {
    const cachedResult = store.getQueryData<QueryResponse>(queryId, { exact: true });
    const queryVariables = { ...variables, ...nextPageProps };
    return cacheOnly && cachedResult
      ? cachedResult
      : client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, queryVariables, options);
  }

  const queryResult = useReactQuery<QueryResponse | undefined, QueryError>(queryId, fetch, adaptedQueryConfig);

  const { fetchPreviousPage, fetchNextPage, refetch, remove, ...others } = queryResult;

  React.useEffect(() => {
    if (prevValue.queryId === value.queryId && !isInitialMount.current && resolvedQueryConfig?.enabled) {
      // refetch on update and when only client options have been changed
      refetch();
    }
  }, [value.clientProps]);

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // cacheTime=0 not working
  const data = networkOnly && others.isFetching ? undefined : others.data;
  return [
    { ...others, data },
    { fetchPreviousPage, fetchNextPage, refetch, remove, cancel }
  ];
}
