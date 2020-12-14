/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-classes-per-file */
/// <reference path="./typings/tests-entry.d.ts" />

import MoonClient from "../src/moonClient";
import { ClientInstance, ILink } from "../src/utils";

export interface MockedClientConfig {
  baseURL: string;
}

export class MockedClient implements ClientInstance {
  public get: () => Promise<any>;

  public post: () => Promise<any>;

  public delete: () => Promise<any>;

  public put: () => Promise<any>;

  public config: MockedClientConfig;

  constructor(config: MockedClientConfig) {
    this.config = config;
    this.get = jest.fn();
    this.post = jest.fn();
    this.delete = jest.fn();
    this.put = jest.fn();
  }
}

export const createClientFactory = (Factory: typeof MockedClient) => (config: MockedClientConfig): MockedClient => {
  return new Factory(config);
};

export function getMockedMoonClient(links: ILink[], clientFactory = createClientFactory(MockedClient)) {
  return new MoonClient(links, clientFactory);
}

export function getMockedClientFactory({ get = jest.fn(), post = jest.fn() }) {
  class CustomClient extends MockedClient {
    constructor(config: MockedClientConfig) {
      super(config);
      this.get = get;
      this.post = post;
    }
  }
  return createClientFactory(CustomClient);
}
