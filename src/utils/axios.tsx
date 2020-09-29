/* eslint-disable import/prefer-default-export */
import * as qs from "qs";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { IInterceptors } from "./client";

const paramsSerializer = (params: any) => qs.stringify(params, { arrayFormat: "repeat" });

export function createAxiosClient(
  config?: AxiosRequestConfig,
  interceptors?: IInterceptors<AxiosRequestConfig, AxiosResponse>
): AxiosInstance {
  // create Axios client with custom params serializer
  const client = axios.create({
    ...config,
    paramsSerializer: config?.paramsSerializer || paramsSerializer
  });

  // create interceptors
  if (interceptors && interceptors.request && interceptors.request.length > 0 && client.interceptors.request) {
    interceptors.request.forEach(interceptor => client.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected));
  }
  if (interceptors && interceptors.response && interceptors.response.length > 0 && client.interceptors.response) {
    interceptors.response.forEach(interceptor =>
      client.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected)
    );
  }

  return client;
}

export const DEFAULT_CLIENT_FACTORY = createAxiosClient;
