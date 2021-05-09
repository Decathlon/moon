import * as React from "react";
import {
  useInfiniteQuery as useInfiniteReactQuery,
  UseInfiniteQueryResult,
  UseInfiniteQueryOptions as ReactQueryConfig,
  QueryFunctionContext,
  QueryKey
} from "react-query";

import { useMoon, usePrevValue } from "./hooks";
import { getQueryId } from "./useQuery";
import { ClientConfig } from "./utils";

export type IInfiniteQueryResultProps<QueryData, QueryError> = [
  Omit<UseInfiniteQueryResult<QueryData, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove">,
  Pick<UseInfiniteQueryResult<QueryData, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove"> & {
    cancel: () => void;
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
  /** The react-query config. Please see the react-query QueryConfig for more details. */
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
    () => store.defaultQueryObserverOptions(queryConfig),
    [queryConfig, store]
  );

  function fetch({ pageParam }: QueryFunctionContext<QueryKey, QueryPageVariables>) {
    const queryVariables = { ...variables, ...pageParam } as QueryVariables & QueryPageVariables;
    return client.query<QueryVariables & QueryPageVariables, QueryResponse, QueryConfig>(
      source,
      endPoint,
      queryVariables,
      options
    );
  }

  const queryResult = useInfiniteReactQuery<QueryResponse, QueryError, QueryData>(queryId, fetch, queryOptions);

  const { fetchNextPage, fetchPreviousPage, refetch, remove, ...others } = queryResult;

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
    store.cancelQueries(queryId, { exact: true });
  }

  return [others, { fetchNextPage, fetchPreviousPage, remove, refetch, cancel }];
}
