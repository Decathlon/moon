export type Nullable<P> = P | null;

export type PropsWithForwardRef<P, R> = P & { forwardedRef?: React.RefObject<R> };
