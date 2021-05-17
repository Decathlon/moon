import * as React from "react";
import { UseQueryOptions as ReactQueryConfig } from "react-query";

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
    () => store.defaultQueryObserverOptions(queryConfig),
    [queryConfig, store]
  );

  function fetch() {
    return client.query<QueryVariables, QueryResponse, QueryConfig>(source, endPoint, variables, options);
  }
  async function prefetch() {
    await store.prefetchQuery(queryId, fetch, queryOptions);
  }
  return prefetch;
}
