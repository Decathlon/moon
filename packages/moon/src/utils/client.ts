/* eslint-disable import/prefer-default-export */

import { QueryCache, QueryClient, MutationCache } from "../compat";

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
  /**
   * AbortSignal forwarded by Moon to the underlying client (axios, fetch,
   * graphql-request…). When `useQuery` / `useInfiniteQuery` re-fetches or
   * unmounts, TanStack Query v5 aborts the in-flight signal which propagates
   * here. Existing callers don't have to set this themselves.
   */
  signal?: AbortSignal;
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
  patch<R = any>(url: string, data?: any, config?: ClientConfig): Promise<R>;
}

export function getClients(links: ILink[], clientFactory?: ClientFactory): IClients {
  return links.reduce<IClients>((clients, link) => {
    const linkClientFactory = link.clientFactory || clientFactory;
    if (!linkClientFactory) {
      throw new Error("A link client factory must be defined!");
    }
    clients[link.id] = linkClientFactory(link.config, link.interceptors);
    return clients;
  }, {});
}

/**
 * Build a `QueryClient` for a `MoonProvider` instance.
 *
 * Historically Moon kept a `queryClient` cached at module level so multiple
 * `MoonProvider`s shared the same cache. That made SSR and isolated tests
 * unsafe (one suite poisoning another's cache, requests crossing tenants in
 * SSR). The new behavior:
 *   - if the caller supplies a `store`, use it as-is;
 *   - otherwise create a fresh client scoped to the `MoonProvider` instance.
 */
export function createMoonStore(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: { refetchOnWindowFocus: false }
    }
  });
}

/**
 * @deprecated Kept for backward compatibility — use `createMoonStore()` directly
 * or rely on `MoonProvider`, which now creates a per-instance client. Calling
 * this without an argument no longer returns a shared singleton.
 */
export function getMoonStore(store?: QueryClient): QueryClient {
  return store || createMoonStore();
}
