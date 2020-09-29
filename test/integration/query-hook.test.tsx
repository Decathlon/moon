/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import MoonProvider from "../../src/moon-provider";
import useQuery from "../../src/query-hook";
import { links } from "../moon-client.test";
import { createClientFactory, MockedClient, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  foo: string;
}

const response = {
  users: [{ id: 1, name: "John Smith" }]
};

describe("Query component with MoonProvider", () => {
  test("should render the list of users", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.get = get;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const onResponse = jest.fn();
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, MockedClientConfig, typeof response>({
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { onSuccess: onResponse }
        }),
      { wrapper }
    );
    let state = result.current[1];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeTruthy();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[1];
    expect(state.data).toBe(response);
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(response);
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.get = get;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const cache = {
      users: [{ id: 1, name: "Alice Smith" }]
    };

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider
        links={links}
        clientFactory={clientFactory}
        hydrate={{ state: { queries: [{ queryKey: "queryId", data: cache }] } }}
      >
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, MockedClientConfig, typeof response>({
          id: "queryId",
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { enabled: false }
        }),
      { wrapper }
    );
    const [actions, { data, error, isLoading }] = result.current;
    expect(data).toEqual(cache);
    expect(isLoading).toBeFalsy();
    expect(error).toBeNull();
    // fetch
    //@ts-ignore
    act(() => actions.refetch());
    await waitForNextUpdate();
    const state = result.current[1];
    expect(state.data).toEqual(response);
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeNull();
  });

  test("should return an error", async () => {
    const error = "Bimm!";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.get = get;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const onError = jest.fn();
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, MockedClientConfig, typeof response, string>({
          id: "queryId2",
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { onError, retry: false }
        }),
      { wrapper }
    );
    let state = result.current[1];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeTruthy();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[1];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBe(error);
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(error);
  });
});
