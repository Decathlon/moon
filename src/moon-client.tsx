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

  public query = async (
    source: string,
    endPoint: string,
    variables: any = {},
    deserialize?: (response: any) => any,
    options: AxiosRequestConfig = {}
  ) => {
    const client = this.clients[source];
    let response;
    if (client) {
      response = await client.get(endPoint, {
        ...options,
        params: { ...variables }
      });
      response = deserialize ? deserialize(response) : response;
    }
    return response;
  };

  public mutate = async (
    source: string,
    endPoint: string,
    type: MutateType = MutateType.Post,
    variables: any = {},
    options: AxiosRequestConfig = {}
  ) => {
    const client = this.clients[source];
    let response;

    if (client) {
      switch (type) {
        case MutateType.Delete:
          {
            const mutationOptions: AxiosRequestConfig = { ...options, params: { ...variables } };
            response = await client.delete(endPoint, mutationOptions);
          }
          break;

        case MutateType.Put:
          response = await client.put(endPoint, variables, options);
          break;

        default:
          response = await client.post(endPoint, variables, options);
          break;
      }
    }

    return response;
  };
}
