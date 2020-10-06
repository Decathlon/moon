/* eslint-disable max-classes-per-file */
import * as React from "react";
import { Hydrate, HydrateProps } from "react-query/hydration";
import { ReactQueryCacheProvider, QueryCache, ReactQueryConfigProvider, ReactQueryConfig } from "react-query";

import MoonClient from "./moon-client";
import { Nullable, PropsWithForwardRef } from "./typing";
import { ClientFactory, getMoonStore, ILink } from "./utils/client";

export interface IMoonContextValue {
  client: Nullable<MoonClient>;
  store: Nullable<QueryCache>;
}

export interface RquiredMoonContextValue {
  client: MoonClient;
  store: QueryCache;
}

interface IMoonProviderProps {
  // The links ( HTTP clients config)
  links: ILink[];
  // The global Moon client factory (like the moon-axios Axios client for moon https://github.com/dktunited/moon-axios)
  clientFactory: ClientFactory;
  // eslint-disable-next-line no-undef
  children: JSX.Element;
  // The react-query cache object
  store?: QueryCache;
  // The react-query cache config (please see https://react-query.tanstack.com/docs/api/#reactqueryconfigprovider for more details)
  config?: ReactQueryConfig;
  // The react-query initial cache state (please see https://react-query.tanstack.com/docs/api#hydrationdehydrate for more details)
  hydrate?: HydrateProps;
}

export type PropsWithoutMoon<P> = Omit<P, "client" | "store">;

export type PropsWithMoon<P> = P & { client: MoonClient };

export const MoonContext: React.Context<IMoonContextValue> = React.createContext<IMoonContextValue>({
  client: null,
  store: null
});

class MoonProvider extends React.Component<IMoonProviderProps> {
  readonly client: MoonClient;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links, clientFactory } = this.props;
    this.client = new MoonClient(links, clientFactory);
  }

  render() {
    const { children, hydrate, store, config } = this.props;
    const queryCache = getMoonStore(store);
    return (
      <ReactQueryCacheProvider queryCache={queryCache}>
        <ReactQueryConfigProvider config={config || {}}>
          <Hydrate {...hydrate}>
            <MoonContext.Provider value={{ client: this.client, store: queryCache }}>{children}</MoonContext.Provider>
          </Hydrate>
        </ReactQueryConfigProvider>
      </ReactQueryCacheProvider>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withMoon<Props extends Partial<IMoonContextValue> = any>(
  WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>
) {
  type WrappedComponentInstance = typeof WrappedComponent extends React.ComponentClass
    ? InstanceType<React.ComponentClass<Props>>
    : ReturnType<React.FunctionComponent<Props>>;
  type WrappedComponentPropsWithoutMoon = PropsWithoutMoon<Props>;

  const WithMoonComponent: React.FunctionComponent<PropsWithForwardRef<
    React.PropsWithChildren<WrappedComponentPropsWithoutMoon>,
    WrappedComponentInstance
  >> = ({ forwardedRef, ...rest }) => {
    return (
      <MoonContext.Consumer>
        {({ client, store }) => {
          const componentProps = { client, store, ...rest } as Props;
          return <WrappedComponent ref={forwardedRef} {...componentProps} />;
        }}
      </MoonContext.Consumer>
    );
  };

  return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutMoon>((props, ref) => {
    // @ts-ignore I don't know how to implement this without breaking out of the types.
    return <WithMoonComponent forwardedRef={ref} {...props} />;
  });
}

export default MoonProvider;
