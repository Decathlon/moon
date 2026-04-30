import * as React from "react";

import {
  QueryFunctionContext,
  UseQueryResult,
  LegacyUseQueryOptions as ReactQueryConfig,
  useReactQuery,
  useLegacyQueryCallbacks,
  withDefaultQueryOptions,
  cancelQueryById,
  setQueryDataById,
  getQueryDataById,
  removeQueryById
} from "./compat";
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
  Omit<UseQueryResult<QueryResponse, QueryError>, "refetch">,
  Pick<UseQueryResult<QueryResponse, QueryError>, "refetch"> & {
    cancel: () => void;
    /** Remove the cached entry for this query. Provided by Moon (was on `UseQueryResult` in react-query v3). */
    remove: () => void;
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
  /** The cache library config (forwarded to @tanstack/react-query). Accepts the v5 `UseQueryOptions` plus the v3 legacy fields `onSuccess`, `onError`, `onSettled`, `cacheTime`, `keepPreviousData` for backward compatibility. */
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
      withDefaultQueryOptions<QueryData, QueryError, QueryResponse>(store, {
        ...queryConfig,
        // NetworkOnly forces gcTime: 0 so the entry is dropped as soon as the query unmounts,
        // making the next mount fall back to the network instead of returning the cached result.
        cacheTime: networkOnly ? 0 : queryConfig?.cacheTime
      }),
    [queryConfig, networkOnly, store]
  );

  if (isInitialMount.current && networkOnly) {
    // Reset the cache entry to `initialData` (or undefined) so NetworkOnly always
    // starts from a clean slate, not from a stale cached value left by a sibling query.
    setQueryDataById<QueryData | undefined>(store, queryId, queryConfig?.initialData as QueryData | undefined);
  }

  function fetch(context: QueryFunctionContext) {
    const cachedResult = getQueryDataById<QueryResponse>(store, queryId);
    if (cacheOnly && cachedResult) {
      return cachedResult;
    }
    // Forward the AbortSignal supplied by TanStack Query v5 so the underlying
    // client (axios / fetch / graphql-request) can natively cancel on refetch
    // or unmount.
    const optionsWithSignal = { ...(options as Record<string, unknown>), signal: context.signal } as QueryConfig;
    return client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, variables, optionsWithSignal);
  }

  const queryResult = useReactQuery<QueryResponse, QueryError, QueryData>(queryId, fetch, queryOptions);

  // Bridge react-query v3 onSuccess/onError/onSettled (removed in v5).
  useLegacyQueryCallbacks(queryResult, queryConfig);

  const { refetch, ...others } = queryResult;

  function cancel() {
    return cancelQueryById(store, queryId);
  }

  function remove() {
    removeQueryById(store, queryId);
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
