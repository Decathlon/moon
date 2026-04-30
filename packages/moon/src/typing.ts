import * as React from "react";

export type Nullable<P> = P | null;

/**
 * Props extended with a forwarded ref slot. Uses `React.ForwardedRef` (the
 * shape passed by `React.forwardRef`'s callback) rather than `RefObject` so
 * Moon's HOCs can wire up forwarding without `@ts-ignore`.
 */
export type PropsWithForwardRef<P, R> = P & { forwardedRef?: React.ForwardedRef<R> };
