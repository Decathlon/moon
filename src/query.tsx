import * as React from "react";
import { QueryResult } from "react-query";

import { PropsWithForwardRef, Nullable } from "./typing";
import useQuery, { FetchPolicy, IQueryProps } from "./query-hook";
import { useQueriesResults, ResultProps, useQueryResult, QueriesResults } from "./hooks";

export interface IQueryChildrenProps<QueryResponse>
  extends Omit<QueryResult<QueryResponse>, "clear" | "fetchMore" | "refetch" | "remove"> {
  actions: Pick<QueryResult<QueryResponse>, "clear" | "fetchMore" | "refetch" | "remove">;
}

export type QueryChildren<QueryResponse> = (
  props: IQueryChildrenProps<QueryResponse>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IQueryComponentProps<QueryVariables, QueryConfig, QueryResponse>
  extends IQueryProps<QueryVariables, QueryConfig, QueryResponse> {
  children?: QueryChildren<QueryResponse>;
}

function Query<QueryVariables = any, QueryConfig = any, QueryResponse = any>(
  props: IQueryComponentProps<QueryVariables, QueryConfig, QueryResponse>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...queryProps } = props;
  const [actions, state] = useQuery<QueryVariables, QueryConfig, QueryResponse>(queryProps);
  return children ? children({ ...state, actions }) : null;
}

Query.defaultProps = {
  fetchPolicy: FetchPolicy.CacheAndNetwork
};

export function withQueryResult<
  Props = any,
  WrappedComponentPropsWithoutQuery = Props,
  Data = any,
  QueryResultProps = ResultProps
>(queryId: string, resutToProps?: (result?: Data) => QueryResultProps) {
  return (WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) => {
    // @ts-ignore Type 'ComponentClass| FunctionComponent' does not satisfy the constraint 'new (...args: any[]) => any' of  InstanceType.
    type WrappedComponentInstance = InstanceType<typeof WrappedComponent>;

    const WithQueryComponent: React.FunctionComponent<PropsWithForwardRef<
      WrappedComponentPropsWithoutQuery,
      WrappedComponentInstance
    >> = props => {
      const { forwardedRef, ...rest } = props;
      const queryResult = useQueryResult<Data, QueryResultProps>(queryId, resutToProps);
      const queryProps = resutToProps ? queryResult : { [queryId]: queryResult };
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WrappedComponent ref={forwardedRef} {...queryProps} {...(rest as WrappedComponentPropsWithoutQuery)} />;
    };

    return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutQuery>((props, ref) => {
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WithQueryComponent forwardedRef={ref} {...props} />;
    });
  };
}

export function withQueriesResults<
  Props = any,
  WrappedComponentPropsWithoutQuery = Props,
  Data = any,
  QueryResultProps = ResultProps
>(queriesIds: string[], resultsToProps?: (results: QueriesResults<Data>) => QueryResultProps) {
  return (WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) => {
    // @ts-ignore Type 'ComponentClass| FunctionComponent' does not satisfy the constraint 'new (...args: any[]) => any' of  InstanceType.
    type WrappedComponentInstance = InstanceType<typeof WrappedComponent>;

    const WithQueryComponent: React.FunctionComponent<PropsWithForwardRef<
      WrappedComponentPropsWithoutQuery,
      WrappedComponentInstance
    >> = props => {
      const { forwardedRef, ...rest } = props;
      const queryResult = useQueriesResults<Data, QueryResultProps>(queriesIds, resultsToProps);
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WrappedComponent ref={forwardedRef} {...queryResult} {...(rest as WrappedComponentPropsWithoutQuery)} />;
    };

    return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutQuery>((props, ref) => {
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WithQueryComponent forwardedRef={ref} {...props} />;
    });
  };
}

export default Query;
