import * as React from "react";
import { Store } from "redux";
import { AxiosRequestConfig } from "axios";

import { generateId, IClients } from "./utils";
import { updateQueryResult } from "./redux/actions";
import { IMoonStore } from "./redux/reducers";
import { Nullable } from "./typing";
import { MoonContext } from "./moonProvider";

export enum MutateType {
  Delete = "DELETE",
  Post = "POST",
  Put = "PUT"
}

export type PropsWithMoonClient<P> = P & { client: MoonClient };

type PropsWithForwardRef<P, R> = P & { forwardedRef?: React.RefObject<R> };

type PropsWithoutMoonClient<P> = "client" extends keyof P ? Pick<P, Exclude<keyof P, "client">> : P;

export default class MoonClient {
  private readonly clients: IClients;

  private readonly store: Store<IMoonStore>;

  constructor(clients: IClients, store: Store<IMoonStore>) {
    this.clients = clients;
    this.store = store;
  }

  public query = async (
    id: Nullable<string>,
    source: string,
    endPoint: string,
    variables: any = {},
    deserialize?: (response: any) => any,
    options: AxiosRequestConfig = {}
  ) => {
    const client = this.clients[source];
    let response;
    if (client) {
      response = await client.get(endPoint, {
        ...options,
        params: { ...variables }
      });
      response = deserialize ? deserialize(response) : response;
      const queryId = id || generateId(source, endPoint, variables);
      this.store.dispatch(updateQueryResult(queryId, response));
    }
    return response;
  };

  public mutate = async (source: string, endPoint: string, type: MutateType = MutateType.Post, variables: any = {}) => {
    const client = this.clients[source];

    let response;

    if (client) {
      switch (type) {
        case MutateType.Delete:
          response = await client.delete(endPoint, variables);
          break;

        case MutateType.Put:
          response = await client.put(endPoint, variables);
          break;

        default:
          response = await client.post(endPoint, variables);
          break;
      }
    }

    return response;
  };

  public readQuery = (id: Nullable<string>, source?: string, endPoint?: string, variables: any = {}): any | undefined => {
    const queryId = id || generateId(source, endPoint, variables);
    return this.store.getState().queriesResult[queryId];
  };
}

export function withMoonClient<Props = any>(WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) {
  // @ts-ignore Type 'ComponentClass| FunctionComponent' does not satisfy the constraint 'new (...args: any[]) => any' of  InstanceType.
  type WrappedComponentInstance = InstanceType<typeof WrappedComponent>;
  type WrappedComponentPropsWithoutMoonClient = PropsWithoutMoonClient<Props>;

  class WithMoonClientComponent extends React.Component<
    PropsWithForwardRef<WrappedComponentPropsWithoutMoonClient, WrappedComponentInstance>
  > {
    render() {
      const { forwardedRef, ...rest } = this.props;
      return (
        <MoonContext.Consumer>
          {({ client }) => {
            // @ts-ignore I don't know how to implement this without breaking out of the types.
            return <WrappedComponent ref={forwardedRef} client={client} {...(rest as WrappedComponentPropsWithoutMoonClient)} />;
          }}
        </MoonContext.Consumer>
      );
    }
  }

  return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutMoonClient>((props, ref) => {
    // @ts-ignore I don't know how to implement this without breaking out of the types.
    return <WithMoonClientComponent forwardedRef={ref} {...props} />;
  });
}

export function useMoonClient() {
  return React.useContext(MoonContext);
}
