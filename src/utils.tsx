import * as React from "react";
import * as qs from "qs";
import * as hash from "object-hash";
import axios, { AxiosInstance } from "axios";
import { shallowEqual } from "react-redux";

import { ILink, IInterceptors } from "./moonProvider";

export interface IClients {
  [id: string]: AxiosInstance;
}

const paramsSerializer = (params: any) => qs.stringify(params, { arrayFormat: "repeat" });

export function createHttpClient(baseURL: string, interceptors: IInterceptors = {}): AxiosInstance {
  // create Axios client with custom params serializer
  const client = axios.create({
    baseURL,
    paramsSerializer
  });

  // create interceptors
  if (interceptors && interceptors.request && interceptors.request.length > 0) {
    interceptors.request.forEach(interceptor => client.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected));
  }
  if (interceptors && interceptors.response && interceptors.response.length > 0) {
    interceptors.response.forEach(interceptor =>
      client.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected)
    );
  }

  return client;
}

export function getClients(links: ILink[]): IClients {
  return links.reduce((clients, link) => {
    clients[link.id] = createHttpClient(link.baseUrl, link.interceptors);
    return clients;
  }, {});
}

export function generateId(...args: any[]) {
  return hash(args);
}

export function usePrevValue(value?: any) {
  const valueRef = React.useRef(value);
  const prevValue = valueRef.current;
  if (!shallowEqual(prevValue, value)) {
    valueRef.current = value;
  }
  return { value: valueRef.current, prevValue };
}
