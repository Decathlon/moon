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
  Omit<UseQueryResult<QueryResponse, QueryError>, "refetch" | "remove">,
  Pick<UseQueryResult<QueryResponse, QueryError>, "refetch" | "remove"> & {
    cancel: () => void;
  }
];

export interface IQueryProps<
  QueryVariables = any,
  QueryResponse = any,
  QueryData = QueryResponse,
  QueryError = any,
  QueryConfig = any
> {
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
  queryConfig?: ReactQueryConfig<QueryResponse, QueryError, QueryData>;
}

export const getQueryId = (queryProps: Pick<IQueryProps, "id" | "source" | "endPoint" | "variables" | "options">): string => {
  return getId(queryProps);
};

export default function useQuery<
  QueryVariables = any,
  QueryResponse = any,
  QueryData = QueryResponse,
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
}: IQueryProps<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig>): IQueryResultProps<QueryData, QueryError> {
  const { client, store } = useMoon();
  const isInitialMount = React.useRef<boolean>(true);

  const clientProps = { source, endPoint, variables };
  const queryId = getQueryId({ id, ...clientProps });
  const { value, prevValue } = usePrevValue({ queryId, clientProps });

  const cacheOnly = fetchPolicy === FetchPolicy.CacheFirst;
  const networkOnly = fetchPolicy === FetchPolicy.NetworkOnly;

  const queryOptions: ReactQueryConfig<QueryResponse, QueryError, QueryData> = React.useMemo(
    () =>
      store.defaultQueryObserverOptions({
        ...queryConfig,
        // to fix (react-query)
        cacheTime: networkOnly ? 0 : queryConfig?.cacheTime
      }),
    [queryConfig, networkOnly, store]
  );

  if (isInitialMount.current && networkOnly) {
    // remove cache if networkOnly
    // @ts-ignore @react-query must update to undefined
    store.setQueryData<QueryData>(queryId, queryConfig?.initialData);
  }

  function fetch() {
    const cachedResult = store.getQueryData<QueryResponse>(queryId, { exact: true });
    return cacheOnly && cachedResult
      ? cachedResult
      : client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, variables, options);
  }

  const queryResult = useReactQuery<QueryResponse, QueryError, QueryData>(queryId, fetch, queryOptions);

  const { refetch, remove, ...others } = queryResult;

  function cancel() {
    return store.cancelQueries(queryId, { exact: true });
  }

  React.useEffect(() => {
    if (prevValue.queryId === value.queryId && !isInitialMount.current && (queryOptions.enabled ?? true)) {
      // cancel the prev query then refetch on update and when only client options have been changed
      cancel().then(() => refetch());
    }
  }, [value.clientProps]);

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  const data = networkOnly && others.isFetching ? undefined : others.data;

  return [
    { ...others, data },
    { refetch, remove, cancel }
  ];
}
