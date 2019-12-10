import * as React from "react";
import { isEqual } from "lodash";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";

import { useSelector, shallowEqual } from "react-redux";
import { IMoonContextValue } from "./moonProvider";
import { Nullable } from "./typing";
import { useMoonClient } from "./moonClient";
import { IAppWithMoonStore } from "./redux";

export enum FetchPolicy {
  // always try reading data from your cache first
  CacheFirst = "cache-first",
  // first trying to read data from your cache
  CacheAndNetwork = "cache-and-network",
  // never return you initial data from the cache
  NetworkOnly = "network-only"
}

export interface IQueryActions {
  refetch: () => void;
  cancel: () => void;
}

export enum MoonNetworkStatus {
  Ready = 1,
  Fetch = 2,
  Finished = 3
}

interface IChildren<QueryData = any> {
  data?: QueryData;
  loading: boolean;
  error: any;
  networkStatus: MoonNetworkStatus;
  actions: IQueryActions;
}

export interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id?: string;
  source: string;
  endPoint: string;
  variables?: QueryVariables;
  fetchOnMount?: boolean;
  autoRefetchOnUpdate?: boolean;
  fetchPolicy?: FetchPolicy;
  options?: AxiosRequestConfig;
  deserialize?: (response: QueryData) => DeserializedData;
  children?: (props: IChildren<DeserializedData>) => Nullable<JSX.Element | JSX.Element[]>;
  onResponse?: (response: DeserializedData) => void;
  onError?: (error: any) => void;
}

interface IQueryPropsWithMoonClient<QueryData = any, QueryVariables = any, DeserializedData = QueryData>
  extends IQueryProps<QueryData, QueryVariables, DeserializedData>,
    IMoonContextValue {
  cache?: DeserializedData;
}

interface IState<QueryData = any> {
  loading: boolean;
  error: any;
  data?: QueryData;
  cache?: QueryData;
  networkStatus: MoonNetworkStatus;
}

export class DumbQuery<QueryData = any, QueryVariables = any, DeserializedData = QueryData> extends React.Component<
  IQueryPropsWithMoonClient<QueryData, QueryVariables, DeserializedData>,
  IState<DeserializedData>
> {
  static defaultProps = {
    fetchOnMount: true,
    autoRefetchOnUpdate: true,
    fetchPolicy: FetchPolicy.CacheAndNetwork,
    id: null
  };

  // @ts-ignore cancelToken is updated in setCacelToken
  private cancelToken: CancelTokenSource;

  constructor(props: IQueryPropsWithMoonClient) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      networkStatus: MoonNetworkStatus.Ready
    };
    this.setCacelToken();
  }

  static getDerivedStateFromProps(props: IQueryPropsWithMoonClient, state: IState) {
    const { cache: prevCache, data, networkStatus } = state;
    const { cache, fetchPolicy } = props;
    // @ts-ignore see defaultProps.fetchPolicy
    const useCache = [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy);
    if ((useCache || networkStatus === MoonNetworkStatus.Finished) && prevCache !== cache && data !== cache) {
      return { data: cache, cache };
    }
    return null;
  }

  public shouldComponentUpdate(nextProps: IQueryPropsWithMoonClient, nextState: IState) {
    const { cache, ...rest } = this.props;
    const { cache: nextCache, ...nextRest } = nextProps;
    return !shallowEqual(rest, nextRest) || !shallowEqual(this.state, nextState);
  }

  public componentWillUnmount() {
    this.cancelToken.cancel();
  }

  public componentDidMount() {
    const { fetchOnMount } = this.props;
    if (fetchOnMount) {
      this.fetch();
    }
  }

  public componentDidUpdate(prevProps: Readonly<IQueryPropsWithMoonClient<QueryData, QueryVariables, DeserializedData>>): void {
    const { variables, endPoint, source, autoRefetchOnUpdate } = this.props;

    if (autoRefetchOnUpdate) {
      const isVariablesChanged = !isEqual(prevProps.variables, variables);
      const isEndPointChanged = prevProps.endPoint !== endPoint;
      const isSourceChanged = prevProps.source !== source;

      if (isVariablesChanged || isEndPointChanged || isSourceChanged) {
        this.fetch();
      }
    }
  }

  private setCacelToken = () => {
    this.cancelToken = StaticAxios.CancelToken.source();
  };

  private cancel = () => {
    this.cancelToken.cancel();
    this.setState({
      loading: false,
      networkStatus: MoonNetworkStatus.Finished
    });
  };

  private fetch = () => {
    const { id, client, source, endPoint, options, variables, fetchPolicy, deserialize, onResponse, onError, cache } = this.props;
    // @ts-ignore see defaultProps.fetchPolicy
    const useCache = [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy);
    const response: DeserializedData | undefined = useCache ? cache : undefined;

    if (response && FetchPolicy.CacheFirst === fetchPolicy) {
      this.setState(
        {
          loading: false,
          error: null,
          data: response,
          networkStatus: MoonNetworkStatus.Finished
        },
        () => {
          if (onResponse) {
            onResponse(response);
          }
        }
      );
    } else {
      this.setState(
        {
          loading: true,
          error: null,
          data: response,
          networkStatus: MoonNetworkStatus.Fetch
        },
        async () => {
          try {
            // @ts-ignore API context initialized to null
            const deserializedResponse: DeserializedData = await client.query(id, source, endPoint, variables, deserialize, {
              ...options,
              cancelToken: this.cancelToken.token
            });
            this.setState(
              {
                loading: false,
                data: deserializedResponse,
                networkStatus: MoonNetworkStatus.Finished
              },
              () => {
                if (onResponse) {
                  onResponse(deserializedResponse);
                }
                this.setCacelToken();
              }
            );
          } catch (err) {
            if (StaticAxios.isCancel(err)) {
              return;
            }
            this.setState(
              {
                error: err,
                loading: false,
                data: response,
                networkStatus: MoonNetworkStatus.Finished
              },
              () => {
                if (onError) {
                  onError(err);
                }
                this.setCacelToken();
              }
            );
          }
        }
      );
    }
  };

  private actions = {
    refetch: this.fetch,
    cancel: this.cancel
  };

  public render() {
    const { children } = this.props;
    const { loading, data, error, networkStatus } = this.state;
    return children ? children({ loading, data, error, networkStatus, actions: this.actions }) : null;
  }
}

function Query<QueryData = any, QueryVariables = any, DeserializedData = QueryData>(
  props: IQueryProps<QueryData, QueryVariables, DeserializedData>
) {
  const { client } = useMoonClient();
  const { id, source, endPoint, variables } = props;
  const queryId = client && client.getQueryId(id || null, source, endPoint, variables);
  const cache = useSelector<IAppWithMoonStore, DeserializedData>(
    (state: IAppWithMoonStore) => queryId && state.queriesResult[queryId]
  );
  return <DumbQuery<QueryData, QueryVariables, DeserializedData> client={client} {...props} cache={cache} />;
}

Query.defaultProps = {
  fetchOnMount: true,
  autoRefetchOnUpdate: true,
  fetchPolicy: FetchPolicy.CacheAndNetwork,
  id: null
};

export default Query;
