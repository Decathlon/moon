/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import MoonProvider from "../../src/moon-provider";
import useMutation from "../../src/mutation-hook";
import { links } from "../moon-client.test";
import { createClientFactory, MockedClient, MockedClientConfig } from "../testUtils";

interface MutationVariables {
  foo: string;
}

describe("Mutation hook with MoonProvider", () => {
  test("should call the mutate action", async () => {
    const data = {
      data: { status: true }
    };
    const post = jest.fn().mockImplementation(() => Promise.resolve(data));
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.post = post;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const onResponse = jest.fn();
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useMutation<MutationVariables, MockedClientConfig, typeof data>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          mutationConfig: { onSuccess: onResponse }
        }),
      { wrapper }
    );
    act(() => {
      const [mutate, { data, isLoading, error }] = result.current;
      expect(data).toBeUndefined();
      expect(isLoading).toBeFalsy();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[1];
    expect(state.data).toBeUndefined();
    expect(state.isLoading).toBeTruthy();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[1];
    expect(state.data).toBe(data);
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(data, undefined);
  });

  test("should render an error", async () => {
    const error = "Bimm!";
    const post = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.post = post;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const onError = jest.fn();
    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useMutation<MutationVariables, MockedClientConfig, any, string>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          mutationConfig: { onError }
        }),
      { wrapper }
    );
    act(() => {
      const [mutate, { data, isLoading, error }] = result.current;
      expect(data).toBeUndefined();
      expect(isLoading).toBeFalsy();
      expect(error).toBeNull();
      mutate();
    });
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
    expect(onError).toBeCalledWith(error, undefined, undefined);
  });
});
