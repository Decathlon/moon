import { IClients, getClients, ClientFactory, ILink, ClientConfig } from "./utils/client";

export enum MutateType {
  Delete = "DELETE",
  Post = "POST",
  Put = "PUT"
}

export default class MoonClient {
  private readonly clients: IClients;

  constructor(links: ILink[], clientFactory: ClientFactory) {
    this.clients = getClients(links, clientFactory);
  }

  public query<Variables = any, Config extends ClientConfig = any, Response = any>(
    source: string,
    endPoint?: string,
    variables?: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.clients[source];
    if (client) {
      return client.get(endPoint || "", {
        ...options,
        params: { ...options?.params, ...variables }
      });
    }
    return new Promise(resolve => resolve(undefined));
  }

  public mutate<Variables = any, Config extends ClientConfig = any, Response = any>(
    source: string,
    endPoint?: string,
    type: MutateType = MutateType.Post,
    variables?: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.clients[source];
    const clientEndPoint = endPoint || "";
    if (client) {
      switch (type) {
        case MutateType.Delete: {
          const mutationOptions: Config = { ...options, params: { ...options?.params, ...variables } } as Config;
          return client.delete(clientEndPoint, mutationOptions);
        }
        case MutateType.Put:
          return client.put(clientEndPoint, variables, options);
        default:
          return client.post(clientEndPoint, variables, options);
      }
    }

    return new Promise(resolve => resolve(undefined));
  }
}
