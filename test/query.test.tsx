// / <reference path="./typings/tests-entry.d.ts" />

import * as React from "react";
import { mount } from "enzyme";

import { createStore, Store } from "redux";
import MoonClient from "../src/moonClient";
import { DumbQuery, MoonNetworkStatus, FetchPolicy } from "../src/query";
import { IMoonStore } from "../src/redux/reducers";

jest.mock("../src/moonClient");

describe("Query component", () => {
  let moonClient: MoonClient;
  beforeEach(() => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    moonClient = new MoonClient({}, store);
  });
  it("should call the moon client query method", () => {
    moonClient.query = jest.fn();
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      deserialize: (result: any) => result,
      client: moonClient
    };

    const wrapper = mount(<DumbQuery {...props} options={{ responseType: "blob" }} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;

    expect(props.client.query).toHaveBeenCalledWith("FooQueryId", "Foo", "/fooEndPoint", { foo: "fooValue" }, props.deserialize, {
      // @ts-ignore cancelToken is a private prop
      cancelToken: queryInstance.cancelToken.token,
      responseType: "blob"
    });
  });

  it("should call the moon client query methode without cache", () => {
    moonClient.query = jest.fn();
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      deserialize: (result: any) => result,
      client: moonClient,
      fetchPolicy: FetchPolicy.NetworkOnly
    };
    const wrapper = mount(<DumbQuery {...props} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    expect(props.client.query).toHaveBeenCalledWith("FooQueryId", "Foo", "/fooEndPoint", undefined, props.deserialize, {
      // @ts-ignore cancelToken is a private prop
      cancelToken: queryInstance.cancelToken.token
    });
  });

  it("should return cached value", async () => {
    const response = { data: "foodata" };
    const cache = { data: "bardata" };
    moonClient.query = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.CacheFirst,
      cache
    };
    const wrapper = mount(<DumbQuery {...props} />);
    await Promise.resolve();

    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    const firstCall = {
      loading: false,
      error: null,
      data: cache,
      networkStatus: MoonNetworkStatus.Ready,
      // @ts-ignore
      actions: queryInstance.actions
    };
    // @ts-ignore
    const secondCall = {
      loading: false,
      error: null,
      data: cache,
      networkStatus: MoonNetworkStatus.Finished,
      // @ts-ignore
      actions: queryInstance.actions
    };

    expect(props.children).toHaveBeenCalledTimes(2);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall]]);
  });

  it("should return cached value (FetchPolicy = FetchPolicy.CacheAndNetwork)", async () => {
    const response = { data: "foodata" };
    const cache = { data: "bardata" };
    moonClient.query = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.CacheAndNetwork,
      cache
    };
    const wrapper = mount(<DumbQuery {...props} />);
    await Promise.resolve();

    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    const firstCall = {
      loading: false,
      error: null,
      data: cache,
      networkStatus: MoonNetworkStatus.Ready,
      // @ts-ignore
      actions: queryInstance.actions
    };
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      data: cache,
      networkStatus: MoonNetworkStatus.Fetch,
      // @ts-ignore
      actions: queryInstance.actions
    };
    const thirdCall = {
      loading: false,
      error: null,
      data: response,
      networkStatus: MoonNetworkStatus.Finished,
      // @ts-ignore
      actions: queryInstance.actions
    };
    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should call children without cache", async () => {
    const response = { data: "foodata" };
    moonClient.query = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.NetworkOnly
    };
    const wrapper = mount(<DumbQuery {...props} />);
    await Promise.resolve();

    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    const firstCall = {
      loading: false,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Ready,
      // @ts-ignore
      actions: queryInstance.actions
    };
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Fetch,
      // @ts-ignore
      actions: queryInstance.actions
    };
    const thirdCall = {
      loading: false,
      error: null,
      data: response,
      networkStatus: MoonNetworkStatus.Finished,
      // @ts-ignore
      actions: queryInstance.actions
    };

    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should call children with error", async () => {
    const error = new Error("Boom!");
    moonClient.query = jest.fn().mockImplementation(() => {
      throw error;
    });
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.NetworkOnly
    };
    const wrapper = mount(<DumbQuery {...props} />);
    await Promise.resolve();

    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    const firstCall = {
      loading: false,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Ready,
      // @ts-ignore
      actions: queryInstance.actions
    };
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Fetch,
      // @ts-ignore
      actions: queryInstance.actions
    };
    const thirdCall = {
      loading: false,
      error,
      data: undefined,
      networkStatus: MoonNetworkStatus.Finished,
      // @ts-ignore
      actions: queryInstance.actions
    };

    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should call children with fetch function", async () => {
    const response = { data: "foodata" };
    moonClient.query = jest.fn().mockImplementation(() => {
      wrapper.setProps({ cache: response });
      return Promise.resolve(response);
    });
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.NetworkOnly,
      fetchOnMount: false
    };
    const wrapper = mount(<DumbQuery {...props} />);
    await Promise.resolve();

    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    const firstCall = {
      loading: false,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Ready,
      // @ts-ignore
      actions: queryInstance.actions
    };
    expect(props.children).toHaveBeenCalledTimes(1);
    expect(props.children.mock.calls).toEqual([[firstCall]]);
    // @ts-ignore
    queryInstance.fetch();
    await Promise.resolve();
    // @ts-ignore
    const secondCall = {
      loading: true,
      error: null,
      data: undefined,
      networkStatus: MoonNetworkStatus.Fetch,
      // @ts-ignore
      actions: queryInstance.actions
    };
    const thirdCall = {
      loading: false,
      error: null,
      data: response,
      networkStatus: MoonNetworkStatus.Finished,
      // @ts-ignore
      actions: queryInstance.actions
    };

    expect(props.children).toHaveBeenCalledTimes(3);
    expect(props.children.mock.calls).toEqual([[firstCall], [secondCall], [thirdCall]]);
  });

  it("should refetch on update", () => {
    moonClient.query = jest.fn();
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.NetworkOnly,
      autoRefetchOnUpdate: true
    };
    const wrapper = mount(<DumbQuery {...props} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;

    expect(props.client.query).toHaveBeenCalledWith("FooQueryId", "Foo", "/fooEndPoint", { foo: "fooValue" }, undefined, {
      // @ts-ignore cancelToken is a private prop
      cancelToken: queryInstance.cancelToken.token
    });
    moonClient.query = jest.fn();
    wrapper.setProps({ variables: { foo: "newValue" } });
    expect(props.client.query).toHaveBeenCalledWith("FooQueryId", "Foo", "/fooEndPoint", { foo: "newValue" }, undefined, {
      // @ts-ignore cancelToken is a private prop
      cancelToken: queryInstance.cancelToken.token
    });
  });

  it("shouldn't refetch on update", () => {
    moonClient.query = jest.fn();
    const props = {
      id: "FooQueryId",
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      children: jest.fn().mockImplementation(() => null),
      fetchPolicy: FetchPolicy.NetworkOnly,
      autoRefetchOnUpdate: false
    };
    const wrapper = mount(<DumbQuery {...props} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;

    expect(props.client.query).toHaveBeenCalledWith("FooQueryId", "Foo", "/fooEndPoint", { foo: "fooValue" }, undefined, {
      // @ts-ignore cancelToken is a private prop
      cancelToken: queryInstance.cancelToken.token
    });
    moonClient.query = jest.fn();
    wrapper.setProps({ variables: { foo: "newValue" } });
    expect(props.client.query).not.toBeCalled();
  });

  it("should call onError", () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const error = new Error("Boom!");
    moonClient.query = jest.fn().mockImplementation(() => {
      throw error;
    });
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      fetchPolicy: FetchPolicy.NetworkOnly,
      fetchOnMount: false,
      onError: jest.fn()
    };
    const wrapper = mount(<DumbQuery {...props} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    // @ts-ignore private function
    queryInstance.fetch();

    expect(props.onError).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith(error);
  });

  it("should call onError on mount", () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const error = new Error("Boom!");
    moonClient.query = jest.fn().mockImplementation(() => {
      throw error;
    });
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      fetchPolicy: FetchPolicy.NetworkOnly,
      onError: jest.fn()
    };
    mount(<DumbQuery {...props} />);

    expect(props.onError).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith(error);
  });

  it("should call onResponse", async () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const response = { status: true };
    moonClient.query = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      fetchPolicy: FetchPolicy.NetworkOnly,
      fetchOnMount: false,
      onResponse: jest.fn()
    };
    const wrapper = mount(<DumbQuery {...props} />);
    const queryInstance: DumbQuery = wrapper.instance() as DumbQuery;
    // @ts-ignore private function
    queryInstance.fetch();
    await Promise.resolve();

    expect(props.onResponse).toHaveBeenCalledTimes(1);
    expect(props.onResponse).toHaveBeenCalledWith(response);
  });

  it("should call onResponse on mount", async () => {
    const store: Store<IMoonStore> = createStore(() => {}, undefined, undefined);
    const moonClient = new MoonClient({}, store);
    const response = { status: true };
    moonClient.query = jest.fn().mockImplementation(() => Promise.resolve(response));
    const props = {
      endPoint: "/fooEndPoint",
      source: "Foo",
      variables: { foo: "fooValue" },
      client: moonClient,
      fetchPolicy: FetchPolicy.NetworkOnly,
      onResponse: jest.fn()
    };
    mount(<DumbQuery {...props} />);
    await Promise.resolve();

    expect(props.onResponse).toHaveBeenCalledTimes(1);
    expect(props.onResponse).toHaveBeenCalledWith(response);
  });
});
