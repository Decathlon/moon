import { UseInfiniteQueryResult, InfiniteData } from "./compat";

import { Nullable } from "./typing";
import useInfiniteQuery, { IInfiniteQueryProps } from "./useInfiniteQuery";
import { ClientConfig } from "./utils";

type WrappedInfinite<QueryResponse, QueryError> = UseInfiniteQueryResult<InfiniteData<QueryResponse>, QueryError>;

export interface IInfiniteQueryChildrenProps<QueryResponse, QueryError>
  extends Omit<WrappedInfinite<QueryResponse, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch"> {
  actions: Pick<WrappedInfinite<QueryResponse, QueryError>, "fetchNextPage" | "fetchPreviousPage" | "refetch"> & {
    remove: () => void;
    cancel: () => void;
  };
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
  QueryConfig extends ClientConfig
> extends IInfiniteQueryProps<QueryVariables & QueryPageVariables, QueryResponse, QueryData, QueryError, QueryConfig> {
  children?: InfiniteQueryChildren<QueryData, QueryError>;
}

function InfiniteQuery<
  QueryVariables = any,
  QueryPageVariables = any,
  QueryResponse = any,
  QueryData = QueryResponse,
  QueryError = any,
  QueryConfig extends ClientConfig = any
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
