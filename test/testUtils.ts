/// <reference path="./typings/tests-entry.d.ts" />

import MoonClient from "../src/moon-client";
import { ClientInstance, ILink } from "../src/utils";

export interface MockedClientConfig {
  baseURL: string;
}
export class MockedClient implements ClientInstance {
  public get: () => Promise<any>;

  public post: () => Promise<any>;

  public delete: () => Promise<any>;

  public put: () => Promise<any>;

  public baseURL: string;

  constructor(config: MockedClientConfig) {
    this.baseURL = config.baseURL;
    this.get = jest.fn();
    this.post = jest.fn();
    this.delete = jest.fn();
    this.put = jest.fn();
  }

  interceptors = {
    request: { use: () => 1, eject: () => undefined },
    response: { use: () => 1, eject: () => undefined }
  };
}

export const createClientFactory = (Factory: typeof MockedClient) => (config: MockedClientConfig): MockedClient => {
  return new Factory(config);
};
export function getMockedMoonClient(links: ILink[], clientFactory = createClientFactory(MockedClient)) {
  return new MoonClient(links, clientFactory);
}
