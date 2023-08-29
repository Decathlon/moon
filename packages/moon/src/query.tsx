import * as React from "react";
import { InfiniteData, UseQueryResult } from "react-query";

import { PropsWithForwardRef, Nullable } from "./typing";
import useQuery, { FetchPolicy, IQueryProps } from "./useQuery";
import { useQueriesResults, ResultProps, useQueryResult, QueriesResults } from "./hooks";
import { ClientConfig } from "./utils";

export interface IQueryChildrenProps<QueryData, QueryError>
  extends Omit<UseQueryResult<QueryData, QueryError>, "refetch" | "remove"> {
  actions: Pick<UseQueryResult<QueryData, QueryError>, "refetch" | "remove">;
}

export type QueryChildren<QueryData, QueryError> = (
  props: IQueryChildrenProps<QueryData, QueryError>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IQueryComponentProps<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig>
  extends IQueryProps<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig> {
  children?: QueryChildren<QueryData, QueryError>;
}

function Query<
  QueryVariables = any,
  QueryResponse = any,
  QueryData = QueryResponse,
  QueryError = any,
  QueryConfig extends ClientConfig = any
>(
  props: IQueryComponentProps<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...queryProps } = props;
  const [state, actions] = useQuery<QueryVariables, QueryResponse, QueryData, QueryError, QueryConfig>(queryProps);
  return children ? children({ ...state, actions }) : null;
}

Query.defaultProps = {
  fetchPolicy: FetchPolicy.CacheAndNetwork
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withQueryResult<Props = any, Data = any, QueryResultProps = ResultProps>(
  queryId: string,
  resutToProps?: (result?: Data | InfiniteData<Data>) => QueryResultProps
) {
  type QueryProps = QueryResultProps | { queryResult: Data };
  type WrappedComponentPropsWithoutQuery = Pick<Props, Exclude<keyof Props, keyof QueryProps>>;
  return (WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) => {
    type WrappedComponentInstance = typeof WrappedComponent extends React.ComponentClass
      ? InstanceType<React.ComponentClass<Props>>
      : ReturnType<React.FunctionComponent<Props>>;
    const WithQueryComponent: React.FunctionComponent<PropsWithForwardRef<
      React.PropsWithChildren<WrappedComponentPropsWithoutQuery>,
      WrappedComponentInstance
    >> = props => {
      const { forwardedRef, ...rest } = props;
      const queryResult = useQueryResult<Data, QueryResultProps>(queryId, resutToProps);
      const queryProps: QueryProps = resutToProps ? (queryResult as QueryResultProps) : { queryResult: queryResult as Data };
      const componentProps = ({ ...queryProps, ...((rest as unknown) as WrappedComponentPropsWithoutQuery) } as unknown) as Props;
      return <WrappedComponent ref={forwardedRef} {...componentProps} />;
    };

    return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutQuery>((props, ref) => {
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WithQueryComponent forwardedRef={ref} {...props} />;
    });
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withQueriesResults<Props = any, Data = any, QueryResultProps = ResultProps>(
  queriesIds: string[],
  resultsToProps?: (results: QueriesResults<Data>) => QueryResultProps
) {
  type QueryProps = QueryResultProps | { queriesResults: QueriesResults<Data> };
  type WrappedComponentPropsWithoutQuery = Pick<Props, Exclude<keyof Props, keyof QueryProps>>;

  return (WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) => {
    type WrappedComponentInstance = typeof WrappedComponent extends React.ComponentClass
      ? InstanceType<React.ComponentClass<Props>>
      : ReturnType<React.FunctionComponent<Props>>;
    const WithQueryComponent: React.FunctionComponent<PropsWithForwardRef<
      WrappedComponentPropsWithoutQuery,
      WrappedComponentInstance
    >> = props => {
      const { forwardedRef, ...rest } = props;
      const queriesResults = useQueriesResults<QueryResultProps>(queriesIds, resultsToProps);
      const componentProps = ({
        queriesResults,
        ...((rest as unknown) as WrappedComponentPropsWithoutQuery)
      } as unknown) as Props;
      return <WrappedComponent ref={forwardedRef} {...componentProps} />;
    };

    return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutQuery>((props, ref) => {
      // @ts-ignore I don't know how to implement this without breaking out of the types.
      return <WithQueryComponent forwardedRef={ref} {...props} />;
    });
  };
}

export default Query;
