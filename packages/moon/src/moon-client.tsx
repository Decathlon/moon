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

  private getClientInstance(source?: string) {
    const clientsIds = Object.keys(this.clients);
    if (clientsIds.length === 1) {
      return this.clients[clientsIds[0]];
    }

    return source !== undefined ? this.clients[source] : undefined;
  }

  public query<Variables = any, Response = any, Config extends ClientConfig = any>(
    source?: string,
    endPoint?: string,
    variables?: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.getClientInstance(source);
    if (client) {
      return client.get(endPoint || "", {
        ...options,
        params: { ...options?.params, ...variables }
      });
    }
    return new Promise(reject => reject(undefined));
  }

  public mutate<Variables = any, Response = any, Config extends ClientConfig = any>(
    source?: string,
    endPoint?: string,
    type: MutateType = MutateType.Post,
    variables?: Variables,
    options?: Config
  ): Promise<Response> {
    const client = this.getClientInstance(source);
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

    return new Promise(reject => reject(undefined));
  }
}
