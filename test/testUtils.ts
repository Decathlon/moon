/// <reference path="./typings/tests-entry.d.ts" />

import Axios from "axios";

import MoonClient, { ILink } from "../src/moon-client";

jest.unmock("axios");

export class AxiosClient {
  public get: () => Promise<any>;

  public post: () => Promise<any>;

  public delete: () => Promise<any>;

  public put: () => Promise<any>;

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
  return new MoonClient(links);
}
