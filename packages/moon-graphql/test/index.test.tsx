import { GraphQLClient } from "graphql-request";
import createGraphQLClient, { MoonGraphQLInstance } from "../src";

jest.mock("graphql-request", () => {
  const actual = jest.requireActual("graphql-request");
  return {
    ...actual,
    GraphQLClient: jest.fn()
  };
});

const MockedGraphQLClient = (GraphQLClient as unknown) as jest.Mock;

beforeEach(() => {
  MockedGraphQLClient.mockReset();
});

describe("createGraphQLClient", () => {
  it("creates a graphql client with the baseURL", () => {
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    expect(myClient).toBeDefined();
    expect(myClient).toBeInstanceOf(MoonGraphQLInstance);
    expect(myClient.config.baseURL).toEqual("https://my.url");
  });

  it("exposes a default `instance` on the MoonGraphQLInstance (parity with moon-axios)", () => {
    MockedGraphQLClient.mockImplementation(() => ({ request: jest.fn() }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    expect(myClient.instance).toBeDefined();
    // The first GraphQLClient ever instantiated for this Moon client is the
    // default `instance` field — built with the link's base configuration.
    expect(MockedGraphQLClient.mock.calls[0][0]).toBe("https://my.url");
  });

  it("query() forwards to GraphQLClient.request", async () => {
    const response = { hello: "world" };
    const request = jest.fn().mockResolvedValue(response);
    MockedGraphQLClient.mockImplementation(() => ({ request }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    const result = await myClient.query<typeof response>("{ hello }", { params: { name: "x" } });
    expect(result).toEqual(response);
    expect(MockedGraphQLClient).toHaveBeenCalledWith("https://my.url", expect.any(Object));
    expect(request).toHaveBeenCalledTimes(1);
    // third arg is options.headers — undefined when no interceptor sets headers
    expect(request).toHaveBeenCalledWith("{ hello }", { name: "x" }, undefined);
  });

  it("invokes request interceptors before issuing the call", async () => {
    const onRequest = jest.fn((opts: any) => ({ ...opts, headers: { Authorization: "Bearer X" } }));
    const request = jest.fn().mockResolvedValue({});
    MockedGraphQLClient.mockImplementation(() => ({ request }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" }, { request: [{ onFulfilled: onRequest }] });
    await myClient.query("{ ping }");
    expect(onRequest).toHaveBeenCalledTimes(1);
    // The patched options must be forwarded to the GraphQLClient instance built
    // for this specific request — the last constructor call (the default
    // per-instance client built in the MoonGraphQLInstance constructor uses the
    // un-patched config and may show up earlier in the call list).
    const { calls } = MockedGraphQLClient.mock;
    const passedOptions = calls[calls.length - 1][1];
    expect(passedOptions.headers).toEqual({ Authorization: "Bearer X" });
  });

  it("invokes response interceptors on success", async () => {
    const onSuccess = jest.fn();
    const response = { data: 1 };
    MockedGraphQLClient.mockImplementation(() => ({ request: jest.fn().mockResolvedValue(response) }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" }, { response: [{ onFulfilled: onSuccess }] });
    await myClient.query("{ ping }");
    expect(onSuccess).toHaveBeenCalledWith(response);
  });

  it("invokes response interceptors on rejection and rethrows", async () => {
    const onError = jest.fn();
    const error = new Error("boom");
    MockedGraphQLClient.mockImplementation(() => ({ request: jest.fn().mockRejectedValue(error) }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" }, { response: [{ onRejected: onError }] });
    await expect(myClient.query("{ ping }")).rejects.toThrow("boom");
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("attaches a cancel function on the returned promise", () => {
    MockedGraphQLClient.mockImplementation(() => ({ request: () => new Promise<never>(() => undefined) }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    const promise: any = myClient.query("{ ping }");
    expect(typeof promise.cancel).toBe("function");
    expect(() => promise.cancel()).not.toThrow();
  });

  it("post/put/patch/delete merge variables into params and route through query()", async () => {
    const request = jest.fn().mockResolvedValue({});
    MockedGraphQLClient.mockImplementation(() => ({ request }));
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    await myClient.post("mutation X", { foo: "bar" });
    await myClient.put("mutation Y", { foo: "baz" });
    await myClient.patch("mutation Z", { foo: "qux" });
    await myClient.delete("mutation D", { params: { id: 1 } });
    expect(request).toHaveBeenCalledTimes(4);
    expect(request).toHaveBeenNthCalledWith(1, "mutation X", { foo: "bar" }, undefined);
    expect(request).toHaveBeenNthCalledWith(2, "mutation Y", { foo: "baz" }, undefined);
    expect(request).toHaveBeenNthCalledWith(3, "mutation Z", { foo: "qux" }, undefined);
    expect(request).toHaveBeenNthCalledWith(4, "mutation D", { id: 1 }, undefined);
  });
});
