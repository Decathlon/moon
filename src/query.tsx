import * as React from "react";

import { PropsWithForwardRef, Nullable } from "./typing";
import useQuery, { IQueryProps, IQueryState, IQueryActions, FetchPolicy } from "./query-hook";
import { useQueryResult, useQueriesResults, ResultProps } from "./hooks";
import { QueriesResults } from "./store";

export type QueryChildren<QueryData> = (props: IQueryChildrenProps<QueryData>) => Nullable<JSX.Element | JSX.Element[]>;

export interface IQueryChildrenProps<QueryData = any> extends IQueryState<QueryData> {
  actions: IQueryActions;
}

interface IDumbQueryProps<QueryData = any> extends IQueryChildrenProps<QueryData> {
  children?: QueryChildren<QueryData>;
}

export interface IQueryComponentProps<QueryData, QueryVariables, DeserializedData>
  extends IQueryProps<QueryData, QueryVariables, DeserializedData> {
  children?: QueryChildren<DeserializedData>;
}

export function DumbQuery<QueryData>(props: IDumbQueryProps<QueryData>) {
  const { children, ...childrenProps } = props;
  return children ? children({ ...childrenProps }) : null;
}

function Query<QueryData = any, QueryVariables = any, DeserializedData = QueryData>(
  props: IQueryComponentProps<QueryData, QueryVariables, DeserializedData>
) {
  const { children, ...queryProps } = props;
  const [state, actions] = useQuery(queryProps);

  return (
    // @ts-ignore Type 'Element[]' is missing the following properties from type 'Element'
    <DumbQuery<DeserializedData> actions={actions} {...state}>
      {children}
    </DumbQuery>
  );
}

Query.defaultProps = {
  fetchOnMount: true,
  autoRefetchOnUpdate: true,
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
