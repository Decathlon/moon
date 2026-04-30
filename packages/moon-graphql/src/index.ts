import { GraphQLClient } from "graphql-request";
import { IInterceptors, ClientInstance } from "@pricemoov-oss/moon";

// `RequestInit` was previously imported from `graphql-request/dist/types.dom`
// (a sub-path removed in graphql-request v5+). It now comes from the DOM lib's
// global Request — re-aliased here so the rest of the file keeps the same name.
// eslint-disable-next-line no-undef
type RequestInit = NonNullable<ConstructorParameters<typeof Request>[1]>;

export interface GraphQLRequestConfig {
  params?: Record<string, any>;
  options?: RequestInit;
}

export interface GraphQLConfig {
  baseURL: string;
  options?: RequestInit;
}

export class MoonGraphQLInstance implements ClientInstance {
  graphQLinterceptors: IInterceptors<RequestInit, any> | undefined;

  config: GraphQLConfig;

  /**
   * Underlying graphql-request client built once with the link's base
   * configuration. Mirrors `MoonAxiosInstance.instance` (the AxiosInstance) so
   * advanced users can reach the native client when Moon's helpers are not
   * enough — e.g. to send a one-off request that bypasses Moon's interceptor
   * pipeline. The per-call `query()` path still builds its own client to apply
   * mutated request options coming from request interceptors.
   */
  instance: GraphQLClient;

  constructor(config: GraphQLConfig, interceptors?: IInterceptors<RequestInit, any>) {
    this.config = config;
    this.graphQLinterceptors = interceptors;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.instance = new GraphQLClient(config.baseURL, (config.options as any) || {});
  }

  useRequestInterceptors(config?: GraphQLRequestConfig): RequestInit {
    let options: RequestInit = { ...this.config.options, ...config?.options };
    this.graphQLinterceptors?.request?.forEach(interceptor => {
      if (interceptor.onFulfilled) {
        options = interceptor.onFulfilled(options) as RequestInit;
      }
    });
    return options;
  }

  useResponseInterceptors(response: unknown, isRejected = false): void {
    this.graphQLinterceptors?.response?.forEach(interceptor => {
      if (!isRejected && interceptor.onFulfilled) {
        interceptor.onFulfilled(response);
      }
      if (isRejected && interceptor.onRejected) {
        interceptor.onRejected(response);
      }
    });
  }

  query<Response = any>(query: string, config?: GraphQLRequestConfig): Promise<Response> {
    const options = this.useRequestInterceptors(config);
    // Prefer the externally supplied signal (TanStack Query v5 forwards one
    // automatically). Only fall back to our own AbortController for legacy
    // callers that rely on the `promise.cancel()` API.
    const externalSignal = options.signal;
    const controller = externalSignal ? null : new AbortController();
    if (controller) {
      options.signal = controller.signal;
    }
    // graphql-request v7 narrows `method` to a literal union and `headers` to its
    // own `MaybeLazy<HeadersInit>` shape; the runtime accepts the same values as
    // the standard DOM RequestInit, so we cast at this boundary.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new GraphQLClient(this.config.baseURL, options as any);
    const getPromise = instance.request<Response, any>(query, config?.params, options.headers).then(
      result => {
        this.useResponseInterceptors(result);
        return result;
      },
      error => {
        this.useResponseInterceptors(error, true);
        throw error;
      }
    );
    // Backward-compat: expose `promise.cancel()`. When TanStack Query owns the
    // signal it aborts on its own — `cancel()` becomes a redundant no-op there,
    // not a bug.
    //@ts-ignore
    getPromise.cancel = () => controller?.abort();
    return getPromise;
  }

  get<Response = any>(query: string, config?: GraphQLRequestConfig): Promise<Response> {
    return this.query<Response>(query, config);
  }

  post<Response = any>(mutation: string, variables?: any, options?: GraphQLRequestConfig): Promise<Response> {
    const config = { ...options, params: { ...options?.params, ...variables } };
    return this.query<Response>(mutation, config);
  }

  delete<Response = any>(mutation: string, config?: GraphQLRequestConfig): Promise<Response> {
    return this.query<Response>(mutation, config);
  }

  put<Response = any>(mutation: string, variables?: any, options?: GraphQLRequestConfig): Promise<Response> {
    const config = { ...options, params: { ...options?.params, ...variables } };
    return this.query<Response>(mutation, config);
  }

  patch<Response = any>(mutation: string, variables?: any, options?: GraphQLRequestConfig): Promise<Response> {
    const config = { ...options, params: { ...options?.params, ...variables } };
    return this.query<Response>(mutation, config);
  }
}

export default function createGraphQLClient(
  config: GraphQLConfig,
  interceptors?: IInterceptors<RequestInit, any>
): MoonGraphQLInstance {
  return new MoonGraphQLInstance(config, interceptors);
}
