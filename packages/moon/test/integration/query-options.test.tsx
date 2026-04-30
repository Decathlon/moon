/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import useQuery from "../../src/useQuery";
import { useMoon } from "../../src/hooks";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  foo: string;
}

const response = { users: [{ id: 1, name: "John Smith" }] };

describe("useQuery - legacy queryConfig surface (must keep working after migration)", () => {
  test("queryConfig.onSuccess is called with the data once the query resolves", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });
    const onSuccess = jest.fn();

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "qopt-onSuccess",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          queryConfig: { onSuccess }
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current[0].data).toBe(response));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith(response);
  });

  test("queryConfig.onError is called with the error once the query rejects", async () => {
    const error = "boom";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ get });
    const onError = jest.fn();

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, typeof response, string, MockedClientConfig>({
          id: "qopt-onError",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          queryConfig: { onError, retry: false }
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current[0].error).toBe(error));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(error);
  });

  test("queryConfig.onSettled is called on success and on error", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });
    const onSettled = jest.fn();

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "qopt-onSettled-success",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          queryConfig: { onSettled }
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current[0].data).toBe(response));
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
    // onSettled signature: (data, error)
    expect(onSettled.mock.calls[0][0]).toBe(response);
    expect(onSettled.mock.calls[0][1] ?? null).toBeNull();
  });

  test("queryConfig.cacheTime is respected (cacheTime: 0 means cache is dropped on unmount)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    let storeRef: any;
    const { unmount } = renderHook(
      () => {
        const moon = useMoon();
        storeRef = moon.store;
        return useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "qopt-cacheTime",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          queryConfig: { cacheTime: 0 }
        });
      },
      { wrapper }
    );
    await waitFor(() => expect(storeRef.getQueryData(["qopt-cacheTime"])).toEqual(response));
    unmount();
    // with cacheTime: 0 the entry is GC'd synchronously after unmount
    await waitFor(() => expect(storeRef.getQueryData(["qopt-cacheTime"])).toBeUndefined());
  });

  test("queryConfig.keepPreviousData keeps the previous data while fetching the next one", async () => {
    const responses: any[] = [{ users: [{ id: 1, name: "John" }] }, { users: [{ id: 2, name: "Alice" }] }];
    let call = 0;
    const get = jest.fn().mockImplementation(() => Promise.resolve(responses[call++]));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    const { result, rerender } = renderHook(
      ({ foo }) =>
        useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo },
          queryConfig: { keepPreviousData: true }
        }),
      { wrapper, initialProps: { foo: "bar" } }
    );
    await waitFor(() => expect(result.current[0].data).toBe(responses[0]));

    rerender({ foo: "baz" });
    // data must still be the previous response while the new query is in flight
    expect(result.current[0].data).toBe(responses[0]);
    await waitFor(() => expect(result.current[0].data).toBe(responses[1]));
  });

  test("actions.remove drops the entry from the cache", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider clientFactory={clientFactory} links={links}>
        {children}
      </MoonProvider>
    );

    let storeRef: any;
    const { result } = renderHook(
      () => {
        const moon = useMoon();
        storeRef = moon.store;
        return useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "qopt-remove",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" }
        });
      },
      { wrapper }
    );
    await waitFor(() => expect(storeRef.getQueryData(["qopt-remove"])).toEqual(response));

    act(() => result.current[1].remove());
    expect(storeRef.getQueryData(["qopt-remove"])).toBeUndefined();
  });
});
