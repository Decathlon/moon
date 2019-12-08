import * as React from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import { Store, Action } from "redux";
import { Provider } from "react-redux";

import { getClients } from "./utils";
import MoonClient from "./moonClient";
import { IMoonStore } from "./redux/reducers";
import { Nullable } from "./typing";
import getMoonStore from "./redux/store";

export interface IMoonContextValue {
  client: Nullable<MoonClient>;
}

interface AxiosInterceptorManagerUseParams<V> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}

export interface IInterceptors {
  request?: AxiosInterceptorManagerUseParams<AxiosRequestConfig>[];
  response?: AxiosInterceptorManagerUseParams<AxiosResponse>[];
}

export interface ILink {
  baseUrl: string;
  id: string;
  interceptors: IInterceptors;
}

interface IMoonProviderProps {
  links: ILink[];
  store?: Store<IMoonStore>;
  children: JSX.Element | JSX.Element[];
}

export const MoonContext: React.Context<IMoonContextValue> = React.createContext<IMoonContextValue>({ client: null });

class MoonProvider extends React.Component<IMoonProviderProps> {
  readonly client: MoonClient;

  readonly moonStore: Store<IMoonStore, Action<any>>;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links, store } = this.props;
    this.moonStore = store || getMoonStore();
    const clients = getClients(links);
    this.client = new MoonClient(clients, this.moonStore);
  }

  render() {
    const { children, store } = this.props;
    const moonProvider = <MoonContext.Provider value={{ client: this.client }}>{children}</MoonContext.Provider>;
    return !store ? <Provider store={this.moonStore}>{moonProvider}</Provider> : moonProvider;
  }
}

export default MoonProvider;
