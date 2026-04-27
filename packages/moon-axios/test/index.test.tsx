import axios, { AxiosRequestConfig } from "axios";
import createAxiosClient from "../src";

describe("createAxiosClient", () => {
  it("creates an axios client with the baseURL", () => {
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    expect(myClient).toBeDefined();
    expect(myClient.instance.defaults.baseURL).toEqual("https://my.url");
  });

  it("registers request and response interceptors passed to the factory", () => {
    const onRequest = jest.fn((c: AxiosRequestConfig) => c);
    const onResponse = jest.fn((r: any) => r);
    const myClient = createAxiosClient(
      { baseURL: "https://my.url" },
      {
        request: [{ onFulfilled: onRequest }],
        response: [{ onFulfilled: onResponse }]
      }
    );
    // axios stores interceptors in handlers array; at least one was registered
    // @ts-ignore handlers is internal but stable across axios 0.x
    expect((myClient.interceptors.request as any).handlers.length).toBeGreaterThan(0);
    // @ts-ignore handlers is internal but stable across axios 0.x
    expect((myClient.interceptors.response as any).handlers.length).toBeGreaterThan(0);
  });

  it("serializes array params with arrayFormat: indices by default", () => {
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    // axios 1.x stores `paramsSerializer` as `{ serialize, ... }`
    const serializer = myClient.instance.defaults.paramsSerializer as { serialize?: (p: any) => string } | undefined;
    expect(typeof serializer?.serialize).toBe("function");
    expect(serializer!.serialize!({ ids: [1, 2, 3] })).toBe("ids%5B0%5D=1&ids%5B1%5D=2&ids%5B2%5D=3");
  });

  it("uses a custom paramsSerializer when provided (function form, normalized to axios 1 object)", () => {
    const customSerializer = jest.fn(() => "custom=1");
    const myClient = createAxiosClient({ baseURL: "https://my.url", paramsSerializer: customSerializer });
    const serializer = myClient.instance.defaults.paramsSerializer as { serialize?: (p: any) => string } | undefined;
    expect(serializer?.serialize).toBe(customSerializer);
  });

  it("attaches a cancel function on the returned promise (get)", () => {
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    // intercept the underlying instance.get to avoid a real network call
    // Never resolves so we can observe cancel() behaviour synchronously.
    const fakePromise: any = new Promise<never>(() => undefined);
    jest.spyOn(myClient.instance, "get").mockReturnValueOnce(fakePromise);
    const promise: any = myClient.get("/foo");
    expect(typeof promise.cancel).toBe("function");
    // calling cancel should not throw
    expect(() => promise.cancel()).not.toThrow();
  });

  it("does not override an existing cancelToken", () => {
    const source = axios.CancelToken.source();
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    const spy = jest.spyOn(myClient.instance, "get").mockImplementation((_url, config) => {
      // verify the cancelToken passed to axios is the user-provided one
      expect(config?.cancelToken).toBe(source.token);
      return new Promise<never>(() => undefined);
    });
    const promise: any = myClient.get("/foo", { cancelToken: source.token });
    // cancel attached to the promise is undefined when the user already provided a cancelToken
    expect(promise.cancel).toBeUndefined();
    spy.mockRestore();
  });

  it("routes mutation methods (post/put/patch/delete) through the underlying axios instance", () => {
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    const fakePromise: any = new Promise<never>(() => undefined);
    const post = jest.spyOn(myClient.instance, "post").mockReturnValue(fakePromise);
    const put = jest.spyOn(myClient.instance, "put").mockReturnValue(fakePromise);
    const patch = jest.spyOn(myClient.instance, "patch").mockReturnValue(fakePromise);
    const del = jest.spyOn(myClient.instance, "delete").mockReturnValue(fakePromise);

    myClient.post("/u", { a: 1 });
    myClient.put("/u", { a: 1 });
    myClient.patch("/u", { a: 1 });
    myClient.delete("/u");

    expect(post).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledTimes(1);
  });
});
