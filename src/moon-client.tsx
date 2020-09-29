import { DEFAULT_CLIENT_FACTORY } from "./utils";
import { IClients, getClients, ClientFactory, ILink } from "./utils/client";

export enum MutateType {
  Delete = "DELETE",
  Post = "POST",
  Put = "PUT"
}

export default class MoonClient {
  private readonly clients: IClients;

  constructor(links: ILink[], clientFactory: ClientFactory = DEFAULT_CLIENT_FACTORY) {
    this.clients = getClients(links, clientFactory);
  }

  public query<Variables = any, Config = any, Response = any>(
    source: string,
    endPoint: string,
    variables: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.clients[source];
    if (client) {
      return client.get(endPoint, {
        ...options,
        params: { ...variables }
      });
    }
    return new Promise(resolve => resolve(undefined));
  }

  public mutate<Variables = any, Config = any, Response = any>(
    source: string,
    endPoint: string,
    type: MutateType = MutateType.Post,
    variables: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.clients[source];
    if (client) {
      switch (type) {
        case MutateType.Delete: {
          const mutationOptions: Config = { ...options, params: { ...variables } } as Config;
          return client.delete(endPoint, mutationOptions);
        }
        case MutateType.Put:
          return client.put(endPoint, variables, options);
        default:
          return client.post(endPoint, variables, options);
      }
    }

    return new Promise(resolve => resolve(undefined));
  }
}
