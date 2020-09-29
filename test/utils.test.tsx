/* eslint-disable  prefer-destructuring */
/// <reference path="./typings/tests-entry.d.ts" />

import { getQueryId, stableStringify } from "../src/utils";
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
    let queryId = getQueryId("myId", "FOO", "/users", { foo: "bar" });
    expect(queryId).toEqual("myId");
    // null id
    queryId = getQueryId(undefined, "FOO", "/users", { foo: "bar" });
    const expectedId = stableStringify(["FOO", "/users", { foo: "bar" }]);
    expect(queryId).toEqual(expectedId);
  });
});
