/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import useQuery from "../../src/useQuery";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  foo: string;
}

const response = { ok: true };

/**
 * TanStack Query v5 forwards an `AbortSignal` to its `queryFn` via the
 * `QueryFunctionContext`. Moon must propagate that signal down to the
 * underlying HTTP client so axios / graphql-request can natively cancel
 * in-flight requests on unmount or refetch.
 */
describe("AbortSignal propagation", () => {
  test("useQuery forwards an AbortSignal through to the client.get options", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "abort-signal-1",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" }
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current[0].data).toEqual(response));

    expect(get).toHaveBeenCalledTimes(1);
    const callOptions = get.mock.calls[0][1];
    expect(callOptions.signal).toBeDefined();
    expect(typeof callOptions.signal.aborted).toBe("boolean");
  });

  test("aborting via unmount turns the forwarded signal's `aborted` to true", async () => {
    let capturedSignal: AbortSignal | undefined;
    const get = jest.fn().mockImplementation((_url: string, config: any) => {
      capturedSignal = config?.signal;
      // Never resolve so we can observe the abort.
      return new Promise<never>(() => undefined);
    });
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { unmount } = renderHook(
      () =>
        useQuery<QueryVariables, typeof response, typeof response, any, MockedClientConfig>({
          id: "abort-signal-unmount",
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" }
        }),
      { wrapper }
    );

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(capturedSignal?.aborted).toBe(false);

    unmount();
    // TanStack Query aborts in-flight queries when their last observer unmounts.
    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
  });
});
