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
  links: ILink[];
  // eslint-disable-next-line no-undef
  children: JSX.Element;
  clientFactory: ClientFactory;
  store?: QueryCache;
  config?: ReactQueryConfig;
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

export function withMoon<Props = any>(WrappedComponent: React.ComponentClass<Props> | React.FunctionComponent<Props>) {
  // @ts-ignore Type 'ComponentClass| FunctionComponent' does not satisfy the constraint 'new (...args: any[]) => any' of  InstanceType.
  type WrappedComponentInstance = InstanceType<typeof WrappedComponent>;
  type WrappedComponentPropsWithoutMoon = PropsWithoutMoon<Props>;

  class WithMoonComponent extends React.Component<
    PropsWithForwardRef<WrappedComponentPropsWithoutMoon, WrappedComponentInstance>
  > {
    render() {
      const { forwardedRef, ...rest } = this.props;
      return (
        <MoonContext.Consumer>
          {({ client, store }) => {
            return (
              // @ts-ignore I don't know how to implement this without breaking out of the types.
              <WrappedComponent
                ref={forwardedRef}
                client={client}
                store={store}
                // @ts-ignore same
                {...(rest as WrappedComponentPropsWithoutMoon)}
              />
            );
          }}
        </MoonContext.Consumer>
      );
    }
  }

  return React.forwardRef<WrappedComponentInstance, WrappedComponentPropsWithoutMoon>((props, ref) => {
    // @ts-ignore I don't know how to implement this without breaking out of the types.
    return <WithMoonComponent forwardedRef={ref} {...props} />;
  });
}

export default MoonProvider;
