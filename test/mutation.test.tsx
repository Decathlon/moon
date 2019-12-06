// / <reference path="./typings/tests-entry.d.ts" />

import * as React from "react";
import { createStore, Store } from "redux";
import { mount } from "enzyme";

import MoonClient, { MutateType } from "../src/moonClient";
import { DumbMutation } from "../src/mutation";
import { IMoonStore } from "../src/redux/reducers";

jest.mock("../src/moonClient");

describe("Mutation component", () => {
  it("should call the moon client mutate methode ", () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    moonClient.mutate = jest.fn();
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      type: MutateType.Put
    };
    const wrapper = mount(<DumbMutation {...props} />);
    const mutationInstance: DumbMutation = wrapper.instance() as DumbMutation;
    // @ts-ignore private function
    mutationInstance.mutate();
    expect(props.client.mutate).toHaveBeenCalledWith("Foo", "/fooEndPoint", MutateType.Put, { foo: "fooValue" });
  });

  it("should call children with error", () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const error = new Error("Boom!");
    moonClient.mutate = jest.fn().mockImplementation(() => {
      throw error;
    });
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      type: MutateType.Put,
      children: jest.fn().mockImplementation(() => null)
    };
    const wrapper = mount(<DumbMutation {...props} />);
    const mutationInstance: DumbMutation = wrapper.instance() as DumbMutation;
    // @ts-ignore private function
    mutationInstance.mutate();

    const firstCall = {
      loading: false,
      error: null,
      response: undefined,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      response: undefined,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };
    const thirdCall = {
      loading: false,
      error,
      response: undefined,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };

    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should call children", async () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const response = { status: true };
    moonClient.mutate = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      type: MutateType.Put,
      children: jest.fn().mockImplementation(() => null)
    };
    const wrapper = mount(<DumbMutation {...props} />);
    const mutationInstance: DumbMutation = wrapper.instance() as DumbMutation;
    // @ts-ignore private function
    mutationInstance.mutate();
    await Promise.resolve();

    const firstCall = {
      loading: false,
      error: null,
      response: undefined,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      response: undefined,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };
    const thirdCall = {
      loading: false,
      error: null,
      response,
      // @ts-ignore
      mutate: mutationInstance.mutate
    };

    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should call onError", () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const error = new Error("Boom!");
    moonClient.mutate = jest.fn().mockImplementation(() => {
      throw error;
    });
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      type: MutateType.Put,
      onError: jest.fn()
    };
    const wrapper = mount(<DumbMutation {...props} />);
    const mutationInstance: DumbMutation = wrapper.instance() as DumbMutation;
    // @ts-ignore private function
    mutationInstance.mutate();

    expect(props.onError).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith(error);
  });

  it("should call onResponse", async () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const response = { status: true };
    moonClient.mutate = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      type: MutateType.Put,
      onResponse: jest.fn()
    };
    const wrapper = mount(<DumbMutation {...props} />);
    const mutationInstance: DumbMutation = wrapper.instance() as DumbMutation;
    // @ts-ignore private function
    mutationInstance.mutate();
    await Promise.resolve();

    expect(props.onResponse).toHaveBeenCalledTimes(1);
    expect(props.onResponse).toHaveBeenCalledWith(response);
  });
});
