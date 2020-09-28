/* eslint-disable max-classes-per-file */
import * as React from "react";
import { Hydrate, HydrateProps } from "react-query/hydration";

import MoonClient, { ILink } from "./moon-client";
import { Nullable, PropsWithForwardRef } from "./typing";

export interface IMoonContextValue {
  client: Nullable<MoonClient>;
}

export interface RquiredMoonContextValue {
  client: MoonClient;
}

interface IMoonProviderProps {
  links: ILink[];
  // eslint-disable-next-line no-undef
  children: JSX.Element;
  hydrate?: HydrateProps;
}

export type PropsWithoutMoon<P> = Omit<P, "client" | "store">;

export type PropsWithMoon<P> = P & { client: MoonClient };

export const MoonContext: React.Context<IMoonContextValue> = React.createContext<IMoonContextValue>({
  client: null
});

class MoonProvider extends React.Component<IMoonProviderProps> {
  readonly client: MoonClient;

  constructor(props: IMoonProviderProps) {
    super(props);
    const { links } = this.props;
    this.client = new MoonClient(links);
  }

  render() {
    const { children, hydrate } = this.props;
    return (
      <Hydrate {...hydrate}>
        <MoonContext.Provider value={{ client: this.client }}>{children}</MoonContext.Provider>
      </Hydrate>
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
          {({ client }) => {
            return (
              // @ts-ignore I don't know how to implement this without breaking out of the types.
              <WrappedComponent
                ref={forwardedRef}
                client={client}
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
