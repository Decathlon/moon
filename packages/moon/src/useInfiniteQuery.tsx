import * as React from "react";

import {
  UseInfiniteQueryResult,
  UseQueryResult,
  LegacyUseInfiniteQueryOptions as ReactQueryConfig,
  LegacyExtras,
  QueryFunctionContext,
  QueryKey,
  InfiniteData,
  useReactInfiniteQuery,
  useLegacyQueryCallbacks,
  withDefaultInfiniteOptions,
  cancelQueryById,
  removeQueryById
} from "./compat";
import { useMoon, usePrevValue } from "./hooks";
import { getQueryId } from "./useQuery";
import { ClientConfig } from "./utils";

// `data` on infinite query results is wrapped in InfiniteData<QueryData> by the cache library.
type WrappedInfiniteResult<QueryData, QueryError> = UseInfiniteQueryResult<InfiniteData<QueryData>, QueryError>;

export type IInfiniteQueryResultProps<QueryData, QueryError> = [
  Omit<WrappedInfiniteResult<QueryData, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch">,
  Pick<WrappedInfiniteResult<QueryData, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch"> & {
    cancel: () => void;
    /** Remove the cached entry for this query. Provided by Moon (was on `UseInfiniteQueryResult` in react-query v3). */
    remove: () => void;
  }
];

export interface IInfiniteQueryProps<
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
  /** The http client options of your query. */
  options?: QueryConfig;
  /** The cache library config (forwarded to @tanstack/react-query). Accepts the v5 `UseInfiniteQueryOptions` plus the v3 legacy fields `onSuccess`, `onError`, `onSettled`, `cacheTime`, `keepPreviousData` for backward compatibility. */
  queryConfig?: ReactQueryConfig<QueryResponse, QueryError, QueryData>;
}

export default function useInfiniteQuery<
  QueryVariables = any,
  QueryPageVariables = any,
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
  queryConfig
}: IInfiniteQueryProps<
  QueryVariables & QueryPageVariables,
  QueryResponse,
  QueryData,
  QueryError,
  QueryConfig
>): IInfiniteQueryResultProps<QueryData, QueryError> {
  const { client, store } = useMoon();
  const isInitialMount = React.useRef<boolean>(true);

  const clientProps = { source, endPoint, variables };
  const queryId = getQueryId({ id, ...clientProps });
  const { value, prevValue } = usePrevValue({ queryId, clientProps });

  const queryOptions: ReactQueryConfig<QueryResponse, QueryError, QueryData> = React.useMemo(
    () => withDefaultInfiniteOptions<QueryData, QueryError, QueryResponse>(store, queryConfig),
    [queryConfig, store]
  );

  function fetch({ pageParam, signal }: QueryFunctionContext<QueryKey, QueryPageVariables>) {
    const pageVars = (pageParam || {}) as Partial<QueryPageVariables>;
    const queryVariables = { ...variables, ...pageVars } as QueryVariables & QueryPageVariables;
    // Forward TanStack Query v5's AbortSignal so the underlying client can cancel
    // the in-flight page request on refetch / unmount.
    const optionsWithSignal = { ...(options as Record<string, unknown>), signal } as QueryConfig;
    return client.query<QueryVariables & QueryPageVariables, QueryResponse, QueryConfig>(
      source,
      endPoint,
      queryVariables,
      optionsWithSignal
    );
  }

  const queryResult = useReactInfiniteQuery<QueryResponse, QueryError, QueryData>(queryId, fetch, queryOptions);

  // Bridge react-query v3 onSuccess/onError/onSettled (removed in v5). The infinite-query
  // result wraps `data` in `InfiniteData<QueryData>` — we forward that wrapped shape so
  // the user's callbacks receive what they used to receive in v3.
  useLegacyQueryCallbacks(
    queryResult as Pick<
      UseQueryResult<InfiniteData<QueryData>, QueryError>,
      "data" | "error" | "dataUpdatedAt" | "errorUpdatedAt"
    >,
    queryConfig as LegacyExtras<InfiniteData<QueryData>, QueryError>
  );

  const { fetchNextPage, fetchPreviousPage, refetch, ...others } = queryResult;

  React.useEffect(() => {
    if (prevValue.queryId === value.queryId && !isInitialMount.current && queryOptions?.enabled) {
      // refetch on update and when only client options have been changed
      refetch();
    }
  }, [value.clientProps]);

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  function cancel() {
    cancelQueryById(store, queryId);
  }

  function remove() {
    removeQueryById(store, queryId);
  }

  return [others, { fetchNextPage, fetchPreviousPage, remove, refetch, cancel }];
}
