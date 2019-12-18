import * as React from "react";

import MoonClient, { ILink } from "./moon-client";
import { Nullable, PropsWithForwardRef } from "./typing";
import getMoonStore, { Queries, Store } from "./store";

export interface IMoonContextValue {
  client: Nullable<MoonClient>;
  store: Nullable<Store>;
}

export interface RquiredMoonContextValue {
  client: MoonClient;
  store: Store;
}

interface IMoonProviderProps {
  links: ILink[];
  initialStore?: Queries;
  children: JSX.Element;
}

export type PropsWithoutMoon<P> = Omit<P, "client" | "store">;

export type PropsWithMoon<P> = P & { client: MoonClient; store: Store };

export const MoonContext: React.Context<IMoonContextValue> = React.createContext<IMoonContextValue>({
  client: null,
  store: null
});

class MoonProvider extends React.Component<IMoonProviderProps> {
  readonly client: MoonClient;

  readonly store: Store;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links, initialStore } = this.props;
    this.store = getMoonStore(initialStore);
    this.client = new MoonClient(links);
  }

  render() {
    const { children } = this.props;
    return <MoonContext.Provider value={{ client: this.client, store: this.store }}>{children}</MoonContext.Provider>;
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
