/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import { Provider } from "react-redux";
import MoonProvider from "../../src/moonProvider";
import useQuery, { useQueriesResult, MoonNetworkStatus } from "../../src/query-hook";
import { links } from "../moonClient.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";
import { createMoonStore } from "../../src/redux/store";

interface QueryData {
  users: { id: number; name: string }[];
}

interface QueryVariables {
  foo: string;
}

const response = {
  users: [{ id: 1, name: "John Smith" }]
};

describe("Query component with MoonProvider", () => {
  test("should render the list of users", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.loading).toBeTruthy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Fetch);
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(response);
    expect(state.loading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Finished);
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    const cache = {
      users: [{ id: 1, name: "Alice Smith" }]
    };
    mockAxiosClientConstructor(CustomAxiosClient);
    const store = createMoonStore({
      queriesResult: {
        queryId: cache
      }
    });
    const wrapper = ({ children }: { children?: any }) => (
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          {children}
        </MoonProvider>
      </Provider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryData, QueryVariables>({
          id: "queryId",
          source: "FOO",
          endPoint: "/users",
          variables,
          fetchOnMount: false
        }),
      { wrapper }
    );
    const [{ loading, data, error, networkStatus }, actions] = result.current;
    expect(data).toEqual(cache);
    expect(loading).toBeFalsy();
    expect(error).toBeNull();
    expect(networkStatus).toBe(MoonNetworkStatus.Ready);
    // fetch
    act(actions.refetch);
    await waitForNextUpdate();
    let state = result.current[0];
    expect(state.data).toEqual(cache);
    expect(state.loading).toBeTruthy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Fetch);
    // waiting to update the cache and the query result
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(response);
    expect(state.loading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Finished);
  });

  test("should render the list of users (controlled fetch)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const store = createMoonStore();
    const wrapper = ({ children }: { children?: any }) => (
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          {children}
        </MoonProvider>
      </Provider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryData, QueryVariables>({
          source: "FOO",
          endPoint: "/users",
          variables,
          fetchOnMount: false
        }),
      { wrapper }
    );
    const [{ loading, data, error, networkStatus }, actions] = result.current;
    expect(data).toBeUndefined();
    expect(loading).toBeFalsy();
    expect(error).toBeNull();
    expect(networkStatus).toBe(MoonNetworkStatus.Ready);
    // fetch
    act(actions.refetch);
    await waitForNextUpdate();
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.loading).toBeTruthy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Fetch);
    // waiting to update the cache and the query result
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(response);
    expect(state.loading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Finished);
  });

  test("should return an error", async () => {
    const error = new Error("Bimm!");

    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const store = createMoonStore();
    const wrapper = ({ children }: { children?: any }) => (
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          {children}
        </MoonProvider>
      </Provider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.loading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(state.networkStatus).toBe(MoonNetworkStatus.Ready);
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.loading).toBeFalsy();
    expect(state.error).toBe(error);
    expect(state.networkStatus).toBe(MoonNetworkStatus.Finished);
  });

  test("should render the query result with useQueriesResult", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "MyQuery", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    const { result } = renderHook(() => useQueriesResult({ MyQuery: "myProp", foo: "bar" }), { wrapper });
    expect(result.current).toEqual({ myProp: response, bar: undefined });
  });
});
