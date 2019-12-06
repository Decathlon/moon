// / <reference path="../../../typings/tests-entry.d.ts" />

import Axios from "axios";

import MoonClient from "../src/moonClient";
import { getClients } from "../src/utils";
import { ILink } from "../src/moonProvider";
import { createMoonStore } from "../src/redux/store";

jest.unmock("axios");

export class AxiosClient {
  public get: () => {};

  public post: () => {};

  public delete: () => {};

  public put: () => {};

  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.get = jest.fn();
    this.post = jest.fn();
    this.delete = jest.fn();
    this.put = jest.fn();
  }

  interceptors = {
    request: { use: () => undefined }
  };
}

export function mockAxiosClientConstructor(ClientFactory = AxiosClient) {
  Axios.create = jest.fn().mockImplementation(({ baseUrl }) => {
    return new ClientFactory(baseUrl);
  });
}

export function getMockedMoonClient(links: ILink[], ClientFactory = AxiosClient) {
  mockAxiosClientConstructor(ClientFactory);
  const clients = getClients(links);
  return new MoonClient(clients, createMoonStore());
}
