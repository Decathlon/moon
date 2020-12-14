/* eslint-disable max-classes-per-file */
/// <reference path="./typings/tests-entry.d.ts" />

import { MutateType } from "../src/moonClient";
import { ILink } from "../src/utils/client";
import { getMockedClientFactory, getMockedMoonClient } from "./testUtils";

// eslint-disable-next-line import/prefer-default-export
export const links: ILink[] = [
  { id: "FOO", config: { baseURL: "http://foo.com" } },
  { id: "BAR", config: { baseURL: "http://bar.com" } }
];

describe("MoonClient class", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the client get function", async () => {
    const moonClient = getMockedMoonClient(links);
    await moonClient.query("FOO", "/users", { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.FOO.get).toHaveBeenCalledWith("/users", {
      params: { foo: "bar" }
    });
    // @ts-ignore
    expect(moonClient.clients.BAR.get).not.toBeCalled();
    await moonClient.query("BAR", "/users", { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.BAR.get).toHaveBeenCalledWith("/users", {
      params: { foo: "bar" }
    });
  });

  it("should return a response on query", async () => {
    const response = {
      users: [{ id: 1, name: "John Smith" }]
    };
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });
    const moonClient = getMockedMoonClient(links, clientFactory);
    const result = await moonClient.query("FOO", "/users", {
      foo: "bar"
    });
    expect(result).toEqual(response);
  });

  it("should call mutate", async () => {
    const moonClient = getMockedMoonClient(links);
    await moonClient.mutate("FOO", "/users", undefined, { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.FOO.post).toHaveBeenCalledWith(
      "/users",
      {
        foo: "bar"
      },
      undefined
    );
    await moonClient.mutate("FOO", "/users", MutateType.Post, { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.FOO.post).toHaveBeenCalledWith(
      "/users",
      {
        foo: "bar"
      },
      undefined
    );
    await moonClient.mutate("FOO", "/users", MutateType.Delete, { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.FOO.delete).toHaveBeenCalledWith("/users", {
      params: { foo: "bar" }
    });
    await moonClient.mutate("FOO", "/users", MutateType.Put, { foo: "bar" });
    // @ts-ignore
    expect(moonClient.clients.FOO.put).toHaveBeenCalledWith(
      "/users",
      {
        foo: "bar"
      },
      undefined
    );
  });

  it("should throw Bimm Error on query", async () => {
    const error = "Bimm!";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ get });
    const moonClient = getMockedMoonClient(links, clientFactory);

    expect.assertions(1);
    moonClient.query("FOO", "/users", { foo: "bar" }).catch((err: Error) => {
      expect(err).toEqual(error);
    });
  });

  it("should throw Boomm Error on query", async () => {
    const error = "Boomm!";
    const post = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ post });
    const moonClient = getMockedMoonClient(links, clientFactory);
    expect.assertions(1);
    moonClient.mutate("FOO", "/users", undefined, { foo: "bar" }).catch((err: Error) => {
      expect(err).toEqual(error);
    });
  });
});
