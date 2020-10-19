import { UseInfiniteQueryResult } from "react-query";

import { Nullable } from "./typing";
import useInfiniteQuery, { IInfiniteQueryProps } from "./useInfiniteQuery";

export interface IInfiniteQueryChildrenProps<QueryResponse, QueryError>
  extends Omit<
    UseInfiniteQueryResult<QueryResponse | undefined, QueryError>,
    "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove"
  > {
  actions: Pick<
    UseInfiniteQueryResult<QueryResponse | undefined, QueryError>,
    "fetchNextPage" | "fetchPreviousPage" | "refetch" | "remove"
  >;
}

export type QueryChildren<QueryResponse, QueryError> = (
  props: IInfiniteQueryChildrenProps<QueryResponse, QueryError>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IInfiniteQueryComponentProps<QueryVariables, QueryResponse, QueryError, QueryConfig>
  extends IInfiniteQueryProps<QueryVariables, QueryResponse, QueryError, QueryConfig> {
  children?: QueryChildren<QueryResponse, QueryError>;
}

function InfiniteQuery<QueryVariables = any, QueryResponse = any, QueryError = any, QueryConfig = any>(
  props: IInfiniteQueryComponentProps<QueryVariables, QueryResponse, QueryError, QueryConfig>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...queryProps } = props;
  const [state, actions] = useInfiniteQuery<QueryVariables, QueryResponse, QueryError, QueryConfig>(queryProps);
  return children ? children({ ...state, actions }) : null;
}

export default InfiniteQuery;
