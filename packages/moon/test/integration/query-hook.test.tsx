/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { hashQueryKey } from "react-query";

import MoonProvider from "../../src/moon-provider";
import useQuery from "../../src/query-hook";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  foo: string;
}

const response = {
  users: [{ id: 1, name: "John Smith" }]
};

describe("Query component with MoonProvider", () => {
  test("should render the list of users", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const onResponse = jest.fn();
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, any, MockedClientConfig>({
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { onSuccess: onResponse }
        }),
      { wrapper }
    );
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeTruthy();
    expect(state.error).toBeFalsy();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(response);
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeFalsy();
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(response);
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const cache = {
      users: [{ id: 1, name: "Alice Smith" }]
    };

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider
        links={links}
        clientFactory={clientFactory}
        hydrate={{ state: { queries: [{ queryKey: "queryId", queryHash: hashQueryKey("queryId"), state: { data: cache } }] } }}
      >
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, any, MockedClientConfig>({
          id: "queryId",
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { enabled: false }
        }),
      { wrapper }
    );
    const [{ data, error, isLoading }, actions] = result.current;
    expect(data).toEqual(cache);
    expect(isLoading).toBeFalsy();
    expect(error).toBeFalsy();
    // fetch
    //@ts-ignore
    act(() => actions.refetch());
    await waitForNextUpdate();
    const state = result.current[0];
    expect(state.data).toEqual(response);
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeFalsy();
  });

  test("should return an error", async () => {
    const error = "Bimm!";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ get });

    const onError = jest.fn();
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const variables = { foo: "bar" };
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, string, MockedClientConfig>({
          id: "queryId2",
          source: "FOO",
          endPoint: "/users",
          variables,
          queryConfig: { onError, retry: false }
        }),
      { wrapper }
    );
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeTruthy();
    expect(state.error).toBeFalsy();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBe(error);
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(error);
  });
});
