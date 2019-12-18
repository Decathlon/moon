/* eslint-disable  prefer-destructuring */
/// <reference path="./typings/tests-entry.d.ts" />
import * as hash from "object-hash";

import { createHttpClient, getClients, getQueryId } from "../src/utils";
import { ILink } from "../src/moon-client";

const interceptor = {
  onFulfilled: jest.fn(),
  onRejected: jest.fn()
};

const links: ILink[] = [
  { id: "FOO", baseUrl: "http://foo.com", interceptors: { request: [interceptor] } },
  { id: "BAR", baseUrl: "http://bar.com", interceptors: { response: [interceptor] } }
];

describe("Utils", () => {
  it("should create an axios client", () => {
    const myClient = createHttpClient("https://my.url");
    expect(myClient).toBeDefined();
    expect(myClient.defaults.baseURL).toEqual("https://my.url");
  });

  it("should create BAR and FOO sources", () => {
    const clients = getClients(links);
    const clientsIds = Object.keys(clients);
    expect(clientsIds).toEqual(["FOO", "BAR"]);
  });

  it("should return the query id", () => {
    let queryId = getQueryId("myId", "FOO", "/users", { foo: "bar" });
    expect(queryId).toEqual("myId");
    // null id
    queryId = getQueryId(undefined, "FOO", "/users", { foo: "bar" });
    const expectedId = hash(["FOO", "/users", { foo: "bar" }]);
    expect(queryId).toEqual(expectedId);
  });
});
