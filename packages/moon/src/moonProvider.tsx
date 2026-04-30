/* eslint-disable max-classes-per-file */
import * as React from "react";
import { Hydrate, HydrateProps, QueryClientProvider, QueryClient } from "./compat";

import MoonClient from "./moonClient";
import { Nullable, PropsWithForwardRef } from "./typing";
import { ClientFactory, createMoonStore, ILink } from "./utils/client";

export interface IMoonContextValue {
  client: Nullable<MoonClient>;
  store: Nullable<QueryClient>;
}

export interface RequiredMoonContextValue {
  client: MoonClient;
  store: QueryClient;
}

/**
 * @deprecated Typo preserved for backward compatibility — use `RequiredMoonContextValue`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RquiredMoonContextValue extends RequiredMoonContextValue {}

interface IMoonProviderProps {
  // The links (HTTP clients config)
  links: ILink[];
  // The global Moon client factory (like the moon-axios Axios client https://github.com/PricemoovOSS/moon)
  clientFactory?: ClientFactory;
  // eslint-disable-next-line no-undef
  children: JSX.Element;
  // The @tanstack/react-query QueryClient
  store?: QueryClient;
  // The @tanstack/react-query initial cache state
  // (see https://tanstack.com/query/latest/docs/framework/react/guides/ssr#using-the-hydration-apis)
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

  // Each MoonProvider owns its own QueryClient — no module-level singleton —
  // so concurrent providers (SSR, multi-tenant tests, isolated suites) cannot
  // poison each other's cache.
  readonly queryClient: QueryClient;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links, clientFactory, store } = this.props;
    this.client = new MoonClient(links, clientFactory);
    this.queryClient = store || createMoonStore();
  }

  render() {
    const { children, hydrate } = this.props;
    const hydrateProps = (hydrate || { state: undefined }) as HydrateProps;
    return (
      <QueryClientProvider client={this.queryClient}>
        <Hydrate {...(hydrateProps as React.ComponentProps<typeof Hydrate>)}>
          <MoonContext.Provider value={{ client: this.client, store: this.queryClient }}>{children}</MoonContext.Provider>
        </Hydrate>
      </QueryClientProvider>
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
    return <WithMoonComponent forwardedRef={ref} {...(props as WrappedComponentPropsWithoutMoon)} />;
  });
}

export default MoonProvider;
