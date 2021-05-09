import { UseInfiniteQueryResult } from "react-query";

import { Nullable } from "./typing";
import useInfiniteQuery, { IInfiniteQueryProps } from "./useInfiniteQuery";

export interface IInfiniteQueryChildrenProps<QueryResponse, QueryError>
  extends Omit<UseInfiniteQueryResult<QueryResponse, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove"> {
  actions: Pick<UseInfiniteQueryResult<QueryResponse, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove">;
}

export type InfiniteQueryChildren<QueryResponse, QueryError> = (
  props: IInfiniteQueryChildrenProps<QueryResponse, QueryError>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IInfiniteQueryComponentProps<
  QueryVariables,
  QueryPageVariables,
  QueryResponse,
  QueryData,
  QueryError,
  QueryConfig
> extends IInfiniteQueryProps<QueryVariables & QueryPageVariables, QueryResponse, QueryData, QueryError, QueryConfig> {
  children?: InfiniteQueryChildren<QueryData, QueryError>;
}

function InfiniteQuery<
  QueryVariables = any,
  QueryPageVariables = any,
  QueryResponse = any,
  QueryData = QueryResponse,
  QueryError = any,
  QueryConfig = any
>(
  props: IInfiniteQueryComponentProps<QueryVariables, QueryPageVariables, QueryResponse, QueryData, QueryError, QueryConfig>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...queryProps } = props;
  const [state, actions] = useInfiniteQuery<
    QueryVariables,
    QueryPageVariables,
    QueryResponse,
    QueryData,
    QueryError,
    QueryConfig
  >(queryProps);
  return children ? children({ ...state, actions }) : null;
}

export default InfiniteQuery;
