/* eslint-disable import/prefer-default-export */

import { QueryCache } from "react-query";

interface InterceptorManagerUseParams<V> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}

export interface IInterceptors<C, R> {
  request?: InterceptorManagerUseParams<C>[];
  response?: InterceptorManagerUseParams<R>[];
}

export interface IClients<I = ClientInstance> {
  [id: string]: I;
}

export type ClientFactory<C extends ClientConfig = any, R = any, I extends ClientInstance = any> = (
  config?: C,
  interceptors?: IInterceptors<C, R>
) => I;

export interface ILink<I extends ClientInstance = any, C extends ClientConfig = any, R = any> {
  id: string;
  config?: C;
  interceptors?: IInterceptors<C, R>;
  clientFactory?: ClientFactory<C, R, I>;
}

export type DataTransformer = (data: any) => any;

export interface ClientConfig {
  baseURL?: string;
  params?: any;
}

export interface ClientInterceptorManager<V> {
  use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export interface ClientInstance {
  interceptors?: {
    request?: ClientInterceptorManager<ClientConfig>;
    response?: ClientInterceptorManager<any>;
  };
  get<R = any>(url: string, config?: ClientConfig): Promise<R>;
  delete<R = any>(url: string, config?: ClientConfig): Promise<R>;
  post<R = any>(url: string, data?: any, config?: ClientConfig): Promise<R>;
  put<R = any>(url: string, data?: any, config?: ClientConfig): Promise<R>;
}

let queryCache: QueryCache;

export function getClients(links: ILink[], clientFactory?: ClientFactory): IClients {
  return links.reduce((clients, link) => {
    const linkClientFactory = link.clientFactory || clientFactory;
    if (!linkClientFactory) {
      throw new Error("A link client factory must be defined!");
    }
    clients[link.id] = linkClientFactory(link.config, link.interceptors);
    return clients;
  }, {});
}

export function getMoonStore(store?: QueryCache): QueryCache {
  if (store) {
    queryCache = store;
    return store;
  }
  if (queryCache) {
    return queryCache;
  }
  queryCache = new QueryCache();
  return queryCache;
}