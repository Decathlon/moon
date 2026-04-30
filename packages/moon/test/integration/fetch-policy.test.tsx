/* eslint-disable max-classes-per-file */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import useQuery, { FetchPolicy } from "../../src/useQuery";
import { QueryClient, setQueryDataById } from "../../src/compat";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

/**
 * Build a wrapper backed by a shared `QueryClient` so the cache-population
 * step and the assertion step see the same cache (each `MoonProvider` now
 * owns its own client).
 */
function makeProvider(clientFactory: any): { wrapper: React.FC<{ children?: React.ReactNode }>; store: QueryClient } {
  const store = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });
  const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <MoonProvider links={links} clientFactory={clientFactory} store={store}>
      {children as React.ReactElement}
    </MoonProvider>
  );
  return { wrapper, store };
}

interface QueryVariables {
  foo: string;
}

const response = { users: [{ id: 1, name: "John Smith" }] };
const cached = { users: [{ id: 2, name: "Alice Smith" }] };

/**
 * Pin the three Apollo-style fetch policies that Moon advertises so any future
 * internal refactor cannot silently change their semantics.
 *
 *   - CacheFirst        : cache hit → no network call.
 *   - CacheAndNetwork   : default; cache served immediately + background refetch.
 *   - NetworkOnly       : cache ignored at mount; cache cleaned on unmount (gcTime: 0).
 */
describe("FetchPolicy contract", () => {
  // ---------------------------------------------------------------------------
  // CacheFirst
  // ---------------------------------------------------------------------------
  describe("CacheFirst", () => {
    test("with no cache: fetches once and returns the network response", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper } = makeProvider(getMockedClientFactory({ get }));

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-cache-first-empty",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.CacheFirst
          }),
        { wrapper }
      );

      expect(result.current[0].data).toBeUndefined();
      expect(result.current[0].isLoading).toBe(true);
      await waitFor(() => expect(result.current[0].data).toEqual(response));
      expect(get).toHaveBeenCalledTimes(1);
    });

    test("with cache pre-populated: serves the cached value without firing the network", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper, store } = makeProvider(getMockedClientFactory({ get }));

      // Seed the cache before mounting the query.
      setQueryDataById(store, "fp-cache-first-hit", cached);

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-cache-first-hit",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.CacheFirst
          }),
        { wrapper }
      );

      // CacheFirst with a cache hit must resolve immediately to the cached value
      // and never call the network.
      await waitFor(() => expect(result.current[0].data).toEqual(cached));
      expect(get).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // CacheAndNetwork (default)
  // ---------------------------------------------------------------------------
  describe("CacheAndNetwork (default)", () => {
    test("with no cache: behaves like a normal query (loading → data)", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper } = makeProvider(getMockedClientFactory({ get }));

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-canet-empty",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.CacheAndNetwork
          }),
        { wrapper }
      );

      expect(result.current[0].isLoading).toBe(true);
      await waitFor(() => expect(result.current[0].data).toEqual(response));
      expect(get).toHaveBeenCalledTimes(1);
    });

    test("with cache pre-populated: cache served immediately AND a network refetch eventually replaces it", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper, store } = makeProvider(getMockedClientFactory({ get }));

      setQueryDataById(store, "fp-canet-hit", cached);

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-canet-hit",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.CacheAndNetwork
          }),
        { wrapper }
      );

      // Cache is served on the very first render — no `loading: true` flash.
      expect(result.current[0].data).toEqual(cached);
      // Network fires in the background and the data is updated to the fresh response.
      await waitFor(() => expect(result.current[0].data).toEqual(response));
      expect(get).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // NetworkOnly
  // ---------------------------------------------------------------------------
  describe("NetworkOnly", () => {
    test("with no cache: fetches and returns the response (data hidden while fetching)", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper } = makeProvider(getMockedClientFactory({ get }));

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-net-only-empty",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.NetworkOnly
          }),
        { wrapper }
      );

      // While fetching, `data` must remain undefined (NetworkOnly never serves stale data).
      expect(result.current[0].data).toBeUndefined();
      expect(result.current[0].isFetching).toBe(true);
      await waitFor(() => expect(result.current[0].data).toEqual(response));
      expect(get).toHaveBeenCalledTimes(1);
    });

    test("with cache pre-populated: cache is ignored on mount and replaced by network response", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper, store } = makeProvider(getMockedClientFactory({ get }));

      setQueryDataById(store, "fp-net-only-hit", cached);

      const { result } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-net-only-hit",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.NetworkOnly
          }),
        { wrapper }
      );

      // The pre-populated cache MUST NOT leak through under NetworkOnly.
      expect(result.current[0].data).not.toEqual(cached);
      await waitFor(() => expect(result.current[0].data).toEqual(response));
      expect(get).toHaveBeenCalledTimes(1);
    });

    test("entry is GC'd on unmount (gcTime: 0)", async () => {
      const get = jest.fn().mockImplementation(() => Promise.resolve(response));
      const { wrapper, store } = makeProvider(getMockedClientFactory({ get }));

      const { unmount } = renderHook(
        () =>
          useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
            id: "fp-net-only-gc",
            source: "FOO",
            endPoint: "/users",
            variables: { foo: "bar" },
            fetchPolicy: FetchPolicy.NetworkOnly
          }),
        { wrapper }
      );

      await waitFor(() => expect(store.getQueryData(["fp-net-only-gc"])).toEqual(response));
      unmount();
      await waitFor(() => expect(store.getQueryData(["fp-net-only-gc"])).toBeUndefined());
    });
  });
});
