import { GraphQLClient } from "graphql-request";
import { RequestInit } from "graphql-request/dist/types.dom";
import { IInterceptors, ClientInstance } from "@pricemoov-oss/moon";

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

  constructor(config: GraphQLConfig, interceptors?: IInterceptors<RequestInit, any>) {
    this.config = config;
    this.graphQLinterceptors = interceptors;
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
    const controller = new AbortController();
    if (!options.signal) {
      options.signal = controller.signal;
    }
    const instance = new GraphQLClient(this.config.baseURL, options);
    const getPromise = instance.request<Response, any>(query, config?.params, options.headers).then(
      result => {
        this.useResponseInterceptors(result);
        return result;
      },
      error => {
        this.useResponseInterceptors(error);
        throw error;
      }
    );
    //@ts-ignore
    getPromise.cancel = () => controller.abort();
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

export default function createAxiosClient(
  config: GraphQLConfig,
  interceptors?: IInterceptors<RequestInit, any>
): MoonGraphQLInstance {
  // create Axios client with custom params serializer
  return new MoonGraphQLInstance(config, interceptors);
}
