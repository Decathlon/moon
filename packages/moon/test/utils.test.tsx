/* eslint-disable  prefer-destructuring */
/// <reference path="./typings/tests-entry.d.ts" />

import { getId, stableStringify, equal } from "../src/utils";
import { getClients, ILink } from "../src/utils/client";
import { createClientFactory, MockedClient } from "./testUtils";

const interceptor = {
  onFulfilled: jest.fn(),
  onRejected: jest.fn()
};

const links: ILink[] = [
  { id: "FOO", config: { baseURL: "http://foo.com" }, interceptors: { request: [interceptor] } },
  { id: "BAR", config: { baseURL: "http://bar.com" }, interceptors: { response: [interceptor] } }
];

describe("Utils", () => {
  it("should create BAR and FOO sources", () => {
    const clients = getClients(links, createClientFactory(MockedClient));
    const clientsIds = Object.keys(clients);
    expect(clientsIds).toEqual(["FOO", "BAR"]);
  });

  it("should return the query id", () => {
    let queryId = getId({ id: "myId", source: "FOO", endPoint: "/users", variables: { foo: "bar" } });
    expect(queryId).toEqual("myId");
    // null id
    queryId = getId({ source: "FOO", endPoint: "/users", variables: { foo: "bar" } });
    const expectedId = stableStringify({ source: "FOO", endPoint: "/users", variables: { foo: "bar" } });
    expect(queryId).toEqual(expectedId);
  });

  it("deep equal should return true", () => {
    expect(equal({}, {}, true)).toBeTruthy();
    expect(equal({ a: "1" }, { a: "1" }, true)).toBeTruthy();
    const a = { id: undefined, source: "FOO", endPoint: "/users", variables: { option: { a: "b" } } };
    const b = { id: undefined, source: "FOO", endPoint: "/users", variables: { option: { a: "b" } } };
    expect(equal(a, b, true)).toBeTruthy();
  });

  it("deep equal should return false", () => {
    expect(equal({ a: "1" }, { a: "2" }, true)).toBeFalsy();
    const a = { id: undefined, source: "FOO", endPoint: "/users", variables: { option: { a: "b" } } };
    const b = { id: undefined, source: "FOO", endPoint: "/users", variables: { option: { a: "a" } } };
    expect(equal(a, b, true)).toBeFalsy();
  });
});
