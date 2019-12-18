/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";

import MoonProvider from "../../src/moon-provider";
import useMutation from "../../src/mutation-hook";
import { links } from "../moon-client.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";

interface MutationResponse {
  status: boolean;
}

interface MutationVariables {
  foo: string;
}

describe("Mutation hook with MoonProvider", () => {
  test("should call the mutate action", async () => {
    const response = {
      status: true
    };
    const post = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.post = post;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const onResponse = jest.fn();
    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useMutation<MutationResponse, MutationVariables>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          onResponse
        }),
      { wrapper }
    );
    act(() => {
      const [{ response, loading, error }, { mutate }] = result.current;
      expect(response).toBeUndefined();
      expect(loading).toBeFalsy();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[0];
    expect(state.response).toBeUndefined();
    expect(state.loading).toBeTruthy();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.response).toBe(response);
    expect(state.loading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(onResponse).toBeCalledTimes(1);
    expect(onResponse).toBeCalledWith(response);
  });

  test("should render an error", async () => {
    const error = new Error("Bimm!");
    const post = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.post = post;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const onError = jest.fn();
    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useMutation<MutationResponse, MutationVariables>({
          source: "FOO",
          endPoint: "/users",
          variables: { foo: "bar" },
          onError
        }),
      { wrapper }
    );
    act(() => {
      const [{ response, loading, error }, { mutate }] = result.current;
      expect(response).toBeUndefined();
      expect(loading).toBeFalsy();
      expect(error).toBeNull();
      mutate();
    });
    let state = result.current[0];
    expect(state.response).toBeUndefined();
    expect(state.loading).toBeTruthy();
    expect(state.error).toBeNull();
    await waitForNextUpdate();
    state = result.current[0];
    expect(state.response).toBeUndefined();
    expect(state.loading).toBeFalsy();
    expect(state.error).toBe(error);
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(error);
  });
});
