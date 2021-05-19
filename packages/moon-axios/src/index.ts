import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosInterceptorManager } from "axios";
import * as qs from "qs";
import { IInterceptors, ClientInstance } from "@decathlon/moon";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const paramsSerializer = (params: any) => qs.stringify(params, { arrayFormat: "repeat" });

function updateCancelToken(config?: AxiosRequestConfig) {
  if (!config?.cancelToken) {
    const cancelTokenSource = axios.CancelToken.source();
    const cancelToken = cancelTokenSource.token;
    const newConfig = config || {};
    newConfig.cancelToken = cancelToken;
    return () => cancelTokenSource.cancel("Query was cancelled by Moon");
  }
  return undefined;
}

export class MoonAxiosInstance implements ClientInstance {
  instance: AxiosInstance;

  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };

  constructor(config?: AxiosRequestConfig, interceptors?: IInterceptors<AxiosRequestConfig, AxiosResponse>) {
    this.instance = axios.create(config);
    this.interceptors = this.instance.interceptors;
    // use request interceptors
    if (interceptors && interceptors.request && interceptors.request.length > 0 && this.interceptors.request) {
      interceptors.request.forEach(interceptor => this.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected));
    }

    // use response interceptors
    if (interceptors && interceptors.response && interceptors.response.length > 0 && this.interceptors.response) {
      interceptors.response.forEach(interceptor =>
        this.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected)
      );
    }
  }

  get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    const cancel = updateCancelToken(config);
    const getPromise = this.instance.get<T, R>(url, config);
    //@ts-ignore
    getPromise.cancel = cancel;
    return getPromise;
  }

  post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> {
    const cancel = updateCancelToken(config);
    const postPromise = this.instance.post<T, R>(url, data, config);
    //@ts-ignore
    postPromise.cancel = cancel;
    return postPromise;
  }

  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    const cancel = updateCancelToken(config);
    const deletePromise = this.instance.delete<T, R>(url, config);
    //@ts-ignore
    deletePromise.cancel = cancel;
    return deletePromise;
  }

  put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> {
    const cancel = updateCancelToken(config);
    const putPromise = this.instance.put<T, R>(url, data, config);
    //@ts-ignore
    putPromise.cancel = cancel;
    return putPromise;
  }

  patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> {
    const cancel = updateCancelToken(config);
    const patchPromise = this.instance.patch<T, R>(url, data, config);
    //@ts-ignore
    patchPromise.cancel = cancel;
    return patchPromise;
  }
}

export default function createAxiosClient(
  config?: AxiosRequestConfig,
  interceptors?: IInterceptors<AxiosRequestConfig, AxiosResponse>
): MoonAxiosInstance {
  // create Axios client with custom params serializer
  return new MoonAxiosInstance(
    {
      ...config,
      paramsSerializer: config?.paramsSerializer || paramsSerializer
    },
    interceptors
  );
}
