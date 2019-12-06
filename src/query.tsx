import * as React from "react";
import { isEqual } from "lodash";
import { AxiosRequestConfig } from "axios";

import { IMoonContextValue, MoonContext } from "./moonProvider";
import { Nullable } from "./typing";

export enum FetchPolicy {
  // always try reading data from your cache first
  CacheFirst = "cache-first",
  // first trying to read data from your cache
  CacheAndNetwork = "cache-and-network",
  // never return you initial data from the cache
  NetworkOnly = "network-only"
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
  actions: { refetch: () => void };
}

export interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id: string;
  source: string;
  endPoint: string;
  variables?: QueryVariables;
  fetchOnMount?: boolean;
  autoRefetchOnUpdate?: boolean;
  fetchPolicy: FetchPolicy;
  options?: AxiosRequestConfig;
  deserialize?: (response: QueryData) => DeserializedData;
  children?: (props: IChildren<DeserializedData>) => Nullable<JSX.Element | JSX.Element[]>;
  onResponse?: (response: DeserializedData) => void;
  onError?: (error: any) => void;
}

interface IProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData>
  extends IQueryProps<QueryData, QueryVariables, DeserializedData>,
    IMoonContextValue {}

interface IState<QueryData = any> {
  loading: boolean;
  error: any;
  data?: QueryData;
  networkStatus: MoonNetworkStatus;
}

export class DumbQuery<QueryData = any, QueryVariables = any, DeserializedData = QueryData> extends React.PureComponent<
  IProps<QueryData, QueryVariables, DeserializedData>,
  IState<DeserializedData>
> {
  static defaultProps = {
    fetchOnMount: true,
    autoRefetchOnUpdate: true,
    fetchPolicy: FetchPolicy.CacheAndNetwork,
    id: null
  };

  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      networkStatus: MoonNetworkStatus.Ready
    };
  }

  public componentDidMount() {
    const { fetchOnMount } = this.props;
    if (fetchOnMount) {
      this.fetch();
    }
  }

  componentDidUpdate(prevProps: Readonly<IProps<QueryData, QueryVariables, DeserializedData>>): void {
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

  private fetch = () => {
    const { id, client, source, endPoint, options, variables, fetchPolicy, deserialize, onResponse, onError } = this.props;
    const useCache = [FetchPolicy.CacheFirst, FetchPolicy.CacheAndNetwork].includes(fetchPolicy);
    const response: DeserializedData = useCache && client ? client.readQuery(id, source, endPoint, variables) : undefined;

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
            const deserializedResponse: DeserializedData = await client.query(
              id,
              source,
              endPoint,
              variables,
              deserialize,
              options
            );
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
              }
            );
          } catch (err) {
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
              }
            );
          }
        }
      );
    }
  };

  private actions = {
    refetch: this.fetch
  };

  public render() {
    const { children } = this.props;
    const { loading, data, error, networkStatus } = this.state;
    return children ? children({ loading, data, error, networkStatus, actions: this.actions }) : null;
  }
}

export default class Query<QueryData = any, QueryVariables = any, DeserializedData = QueryData> extends React.PureComponent<
  IQueryProps<QueryData, QueryVariables, DeserializedData>
> {
  static defaultProps = {
    fetchOnMount: true,
    autoRefetchOnUpdate: true,
    fetchPolicy: FetchPolicy.CacheAndNetwork,
    id: null
  };

  render() {
    return (
      <MoonContext.Consumer>
        {({ client }) => <DumbQuery<QueryData, QueryVariables, DeserializedData> client={client} {...this.props} />}
      </MoonContext.Consumer>
    );
  }
}
