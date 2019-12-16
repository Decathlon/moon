import * as React from "react";

import { Nullable } from "./typing";
import useQuery, { IQueryProps, IQueryState, IQueryActions, FetchPolicy } from "./query-hook";

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

// @ts-ignore ignore children type
export const DumbQuery = React.memo(function DumbQuery<QueryData>(props: IDumbQueryProps<QueryData>) {
  const { children, ...childrenProps } = props;
  return children ? children({ ...childrenProps }) : null;
});

function Query<QueryData = any, QueryVariables = any, DeserializedData = QueryData>(
  props: IQueryComponentProps<QueryData, QueryVariables, DeserializedData>
) {
  const { children, ...queryProps } = props;
  const [state, actions] = useQuery(queryProps);

  return (
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

export default Query;
