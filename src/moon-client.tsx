import { AxiosRequestConfig, AxiosResponse } from "axios";

import { IClients, getClients } from "./utils/axios";

interface InterceptorManagerUseParams<V> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}

export interface IInterceptors {
  request?: InterceptorManagerUseParams<AxiosRequestConfig>[];
  response?: InterceptorManagerUseParams<AxiosResponse>[];
}

export interface ILink {
  baseUrl: string;
  id: string;
  interceptors: IInterceptors;
}

export enum MutateType {
  Delete = "DELETE",
  Post = "POST",
  Put = "PUT"
}

export default class MoonClient {
  private readonly clients: IClients;

  constructor(links: ILink[]) {
    this.clients = getClients(links);
  }

  public query<Data = any, DeserializedData = any, Variables = any>(
    source: string,
    endPoint: string,
    variables: Variables,
    deserialize?: (data: Data) => DeserializedData,
    options: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<Data | DeserializedData>> {
    const client = this.clients[source];
    if (client) {
      return client.get<Data>(endPoint, {
        ...options,
        params: { ...variables },
        transformResponse: deserialize
      });
    }
    return new Promise(resolve => resolve(undefined));
  }

  public mutate<MutationResponse = any, Variables = any>(
    source: string,
    endPoint: string,
    type: MutateType = MutateType.Post,
    variables: Variables,
    options: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<MutationResponse>> {
    const client = this.clients[source];
    if (client) {
      switch (type) {
        case MutateType.Delete: {
          const mutationOptions: AxiosRequestConfig = { ...options, params: { ...variables } };
          return client.delete(endPoint, mutationOptions);
        }
        case MutateType.Put:
          return client.put(endPoint, variables, options);
        default:
          return client.post(endPoint, variables, options);
      }
    }

    return new Promise(resolve => resolve(undefined));
  }
}
