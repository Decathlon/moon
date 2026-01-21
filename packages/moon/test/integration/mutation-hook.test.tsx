/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import MoonProvider from "../../src/moonProvider";
import useMutation from "../../src/useMutation";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface MutationVariables {
  foo: string;
}

describe("Mutation hook with MoonProvider", () => {
  test("should call the mutate action", async () => {
    const data = {
      data: { status: true }
    };
    const post = jest.fn().mockImplementation(() => Promise.resolve(data));
    const clientFactory = getMockedClientFactory({ post });

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
      const [{ data, error }, { mutate }] = result.current;
      expect(data).toBeUndefined();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(data);
    expect(state.error).toBeNull();
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(data, { foo: "bar" }, undefined);
  });

  test("should call the mutate custom action", async () => {
    const data = {
      data: { status: true }
    };
    const mutationFn = jest.fn().mockImplementation(() => Promise.resolve(data));
    const post = jest.fn();
    const clientFactory = getMockedClientFactory({ post });

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
          mutationConfig: { onSuccess: onResponse, mutationFn }
        }),
      { wrapper }
    );
    act(() => {
      const [{ data, error }, { mutate }] = result.current;
      expect(data).toBeUndefined();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBe(data);
    expect(state.error).toBeNull();
    expect(post).toBeCalledTimes(0);
    expect(mutationFn).toBeCalledTimes(1);
    expect(mutationFn).toBeCalledWith({ foo: "bar" });
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(data, { foo: "bar" }, undefined);
  });

  test("should render an error", async () => {
    const error = "Bimm!";
    const post = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ post });

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
      const [{ data, error }, { mutate }] = result.current;
      expect(data).toBeUndefined();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.data).toBeUndefined();
    expect(state.error).toBe(error);
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(error, { foo: "bar" }, undefined);
  });
});
