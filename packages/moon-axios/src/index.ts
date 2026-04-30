import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, ParamsSerializerOptions } from "axios";
import * as qs from "qs";
import { IInterceptors, ClientInstance } from "@pricemoov-oss/moon";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultSerialize = (params: any) => qs.stringify(params, { arrayFormat: "indices" });

/**
 * Axios 1.x expects `paramsSerializer: { serialize, indexes? }`. Moon historically
 * accepted (and documented) `paramsSerializer: (params) => string`. We accept
 * both forms here so existing callers don't have to change.
 */
function normalizeParamsSerializer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: ParamsSerializerOptions | ((params: any) => string) | undefined
): ParamsSerializerOptions {
  if (typeof value === "function") {
    return { serialize: value };
  }
  return value || { serialize: defaultSerialize };
}

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

  // Backward-compat: expose the underlying axios interceptors. We type them through
  // the Moon `ClientInstance` contract so consumers using the loose Moon API keep
  // compiling; cast to `any` at the assignment because axios 1.x tightened its own
  // interceptor types in a way that does not satisfy Moon's narrower contract.
  interceptors: ClientInstance["interceptors"];

  constructor(config?: AxiosRequestConfig, interceptors?: IInterceptors<AxiosRequestConfig, AxiosResponse>) {
    this.instance = axios.create(config);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.interceptors = this.instance.interceptors as any;
    const reqI = this.instance.interceptors.request;
    const resI = this.instance.interceptors.response;
    if (interceptors?.request && interceptors.request.length > 0) {
      interceptors.request.forEach(interceptor =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reqI.use(interceptor.onFulfilled as any, interceptor.onRejected)
      );
    }
    if (interceptors?.response && interceptors.response.length > 0) {
      interceptors.response.forEach(interceptor => resI.use(interceptor.onFulfilled, interceptor.onRejected));
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
  // create Axios client with custom params serializer (axios 1.x expects an object form;
  // we accept the legacy function form too for backward compatibility).
  return new MoonAxiosInstance(
    {
      ...config,
      paramsSerializer: normalizeParamsSerializer(config?.paramsSerializer)
    },
    interceptors
  );
}
