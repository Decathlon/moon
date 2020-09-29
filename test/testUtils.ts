/// <reference path="./typings/tests-entry.d.ts" />

import Axios from "axios";

import MoonClient from "../src/moon-client";
import { ILink } from "../src/utils/client";

jest.unmock("axios");

export class AxiosClient {
  public get: () => Promise<any>;

  public post: () => Promise<any>;

  public delete: () => Promise<any>;

  public put: () => Promise<any>;

  public baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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
  Axios.create = jest.fn().mockImplementation(({ baseURL }) => {
    return new ClientFactory(baseURL);
  });
}

export function getMockedMoonClient(links: ILink[], ClientFactory = AxiosClient) {
  mockAxiosClientConstructor(ClientFactory);
  return new MoonClient(links);
}
