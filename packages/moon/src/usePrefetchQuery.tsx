import * as React from "react";

import {
  QueryFunctionContext,
  LegacyUseQueryOptions as ReactQueryConfig,
  withDefaultQueryOptions,
  prefetchQueryById
} from "./compat";
import { useMoon } from "./hooks";
import { getQueryId, IQueryProps } from "./useQuery";
import { ClientConfig } from "./utils";

export default function usePrefetchQuery<
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
  queryConfig
}: IQueryProps<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig>): () => Promise<void> {
  const { client, store } = useMoon();
  const queryId = getQueryId({ id, source, endPoint, variables });

  const queryOptions: ReactQueryConfig<QueryResponse, QueryError, QueryData> = React.useMemo(
    () => withDefaultQueryOptions<QueryData, QueryError, QueryResponse>(store, queryConfig),
    [queryConfig, store]
  );

  function fetch(context: QueryFunctionContext) {
    const optionsWithSignal = { ...(options as Record<string, unknown>), signal: context.signal } as QueryConfig;
    return client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, variables, optionsWithSignal);
  }
  async function prefetch() {
    await prefetchQueryById(store, queryId, fetch, (queryOptions as unknown) as ReactQueryConfig<QueryResponse>);
  }
  return prefetch;
}
