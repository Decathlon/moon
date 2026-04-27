/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import useMutation from "../../src/useMutation";
import { MutateType } from "../../src/moonClient";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface MutationVariables {
  foo: string;
}

describe("useMutation - extras (dynamic mutate, patch)", () => {
  test("dynamicMutate sends the runtime variables (not the props ones)", async () => {
    const post = jest.fn().mockImplementation((_url: string, body: any) => Promise.resolve({ echoed: body }));
    const clientFactory = getMockedClientFactory({ post });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const { result } = renderHook(
      () =>
        useMutation<MutationVariables, MockedClientConfig, any>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "from-props" }
        }),
      { wrapper }
    );
    act(() => {
      result.current[1].dynamicMutate({ foo: "from-runtime" });
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/users", { foo: "from-runtime" }, undefined);
  });

  test("dynamicMutateAsync resolves with the response", async () => {
    const response = { ok: true };
    const post = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ post });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const { result } = renderHook(
      () =>
        useMutation<MutationVariables, MockedClientConfig, typeof response>({
          source: "FOO",
          endPoint: "/users"
        }),
      { wrapper }
    );

    let resolved: any;
    await act(async () => {
      resolved = await result.current[1].dynamicMutateAsync({ foo: "x" });
    });
    expect(resolved).toEqual(response);
    expect(post).toHaveBeenCalledWith("/users", { foo: "x" }, undefined);
  });

  test("MutateType.Patch routes to client.patch", async () => {
    const patch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));
    const clientFactory = getMockedClientFactory({ post: jest.fn() });
    // patch isn't covered by getMockedClientFactory helper; override by accessing mock instance via custom factory
    const factoryWithPatch = (config: any) => {
      const inst = clientFactory(config);
      inst.patch = patch;
      return inst;
    };

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={factoryWithPatch}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useMutation<MutationVariables, MockedClientConfig, any>({
          source: "FOO",
          endPoint: "/users",
          type: MutateType.Patch,
          variables: { foo: "bar" }
        }),
      { wrapper }
    );
    act(() => {
      result.current[1].mutate();
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/users", { foo: "bar" }, undefined);
  });
});
