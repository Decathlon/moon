/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import MoonProvider from "../../src/moon-provider";
import useQuery from "../../src/query-hook";
import { links } from "../moon-client.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";
import { getDefaultQuery, createMoonStore, MoonNetworkStatus } from "../../src/store";

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
    const onResponse = jest.fn();
    const { result, waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ source: "FOO", endPoint: "/users", variables, onResponse }),
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
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(response);
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const cache = {
      users: [{ id: 1, name: "Alice Smith" }]
    };
    const query = getDefaultQuery("queryId");
    query.state.data = cache;
    createMoonStore({ queryId: query });

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
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
    const state = result.current[0];
    expect(state.data).toEqual(response);
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
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} initialStore={{}}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryData, QueryVariables>({
          id: "queryId1",
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
    const state = result.current[0];
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

    const onError = jest.fn();
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} initialStore={{}}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "queryId2", source: "FOO", endPoint: "/users", variables, onError }),
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
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(error);
  });
});
