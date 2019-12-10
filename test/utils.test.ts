// / <reference path="./typings/tests-entry.d.ts" />

import { createHttpClient, getClients } from "../src/utils";

const links = [
  { id: "FOO", baseUrl: "http://foo.com", interceptors: {} },
  { id: "BAR", baseUrl: "http://bar.com", interceptors: {} }
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
});
