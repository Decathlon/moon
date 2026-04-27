/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Compatibility layer between Moon's public API and the underlying cache library
 * (@tanstack/react-query v5).
 *
 * This module is the SINGLE place that imports from @tanstack/react-query.
 * It provides:
 *   1. Backward-compatible re-exports (so the public surface of @pricemoov-oss/moon
 *      keeps the names users had with react-query v3 / Moon v4): `Hydrate`,
 *      `hashQueryKey`, `HydrateProps`.
 *   2. Internal helpers that wrap v5 calls so the rest of Moon's source stays
 *      agnostic of the cache library version.
 *
 * Behavior contract: callers see exactly the same API as Moon v4 — the public
 * surface is unchanged.
 */
import * as React from "react";
import {
  QueryClient,
  hashKey,
  keepPreviousData as keepPreviousDataFn,
  useQuery as rqUseQuery,
  useInfiniteQuery as rqUseInfiniteQuery,
  useMutation as rqUseMutation,
  HydrationBoundaryProps
} from "@tanstack/react-query";
import type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  QueryFunction,
  InfiniteQueryObserverOptions,
  QueryObserverOptions,
  InfiniteData as InfiniteDataType
} from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Re-exports for the public surface
// ---------------------------------------------------------------------------

export {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  QueryObserver,
  QueriesObserver,
  InfiniteQueryObserver,
  notifyManager,
  hashKey,
  useQueries,
  useQueryClient
} from "@tanstack/react-query";

// Backward-compatible aliases (Moon v4 / react-query v3 names)
export { HydrationBoundary as Hydrate } from "@tanstack/react-query";

/**
 * Backward-compatible alias of v3's `hashQueryKey`. v5 renamed it to `hashKey`
 * AND tightened the signature to require an array. Moon used to call it with a
 * string id, so we wrap to keep the v3 ergonomics.
 */
export function hashQueryKey(key: string | readonly unknown[]): string {
  return hashKey(Array.isArray(key) ? key : [key]);
}

/**
 * `HydrateProps` shape compatible with Moon v4 / react-query v3 (where the
 * `state` field accepted any plain object). v5's `HydrationBoundaryProps`
 * tightens the type, but the runtime accepts any shape — we keep the loose
 * type here for backward compatibility.
 */
export interface HydrateProps {
  state?: unknown;
  options?: HydrationBoundaryProps["options"];
}

export type {
  QueryKey,
  QueryFunction,
  QueryFunctionContext,
  UseQueryResult,
  UseQueryOptions,
  UseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseMutationResult,
  UseMutationOptions,
  MutationOptions,
  QueryObserverOptions,
  InfiniteQueryObserverOptions,
  QueryObserverResult,
  InfiniteData,
  Query,
  QueryState
} from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Legacy options shim
//
// Moon v4 forwarded user-supplied `queryConfig` directly to react-query v3,
// which natively supported `onSuccess`, `onError`, `onSettled`, `cacheTime`
// and `keepPreviousData` on `useQuery` / `useInfiniteQuery`. v5 removed those
// so we translate the bag here. Behavior should match v3 for 99% of usages;
// see CHANGELOG for the rare callback-edge-case caveat.
// ---------------------------------------------------------------------------

/**
 * Fields that react-query v3 (and Moon v4) accepted on `useQuery` /
 * `useInfiniteQuery` options but that v5 removed. Moon keeps accepting them
 * publicly; the compat layer translates them at runtime.
 */
export interface LegacyExtras<TData = any, TError = any> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
  /** Renamed `gcTime` in v5. Both names are accepted. */
  cacheTime?: number;
  /** Replaced by `placeholderData: keepPreviousData` in v5. */
  keepPreviousData?: boolean;
}

/**
 * Public alias used by Moon's `IQueryProps.queryConfig`. Moon supplies the
 * queryKey itself, so it's optional here (in v5 `UseQueryOptions.queryKey` is
 * required).
 */
export type LegacyUseQueryOptions<TQueryFnData = any, TError = any, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData>,
  "queryKey"
> & {
  queryKey?: QueryKey;
} & LegacyExtras<TData, TError>;

/** Public alias used by Moon's `IInfiniteQueryProps.queryConfig`. */
export type LegacyUseInfiniteQueryOptions<TQueryFnData = any, TError = any, TData = TQueryFnData> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData>,
  "queryKey" | "initialPageParam"
> & {
  queryKey?: QueryKey;
  initialPageParam?: unknown;
} & LegacyExtras<TData, TError>;

type LegacyKey = keyof LegacyExtras;

/**
 * Strip the v3-only fields from a user-supplied options bag and translate the
 * renamed ones (`cacheTime` → `gcTime`, `keepPreviousData` → `placeholderData`).
 * The return type advertises that the legacy fields are gone so call sites can
 * forward the bag to TanStack v5 hooks without further casts.
 */
function translateOptions<O extends LegacyExtras>(opts: O | undefined): Omit<O, LegacyKey> | undefined {
  if (!opts) return opts;
  const out: Record<string, unknown> = { ...(opts as Record<string, unknown>) };
  if ("cacheTime" in out && out.gcTime === undefined) {
    out.gcTime = out.cacheTime;
  }
  delete out.cacheTime;
  if (out.keepPreviousData === true && out.placeholderData === undefined) {
    out.placeholderData = keepPreviousDataFn;
  }
  delete out.keepPreviousData;
  delete out.onSuccess;
  delete out.onError;
  delete out.onSettled;
  return out as Omit<O, LegacyKey>;
}

/**
 * Watches a useQuery / useInfiniteQuery result and reproduces the v3 behavior
 * of `onSuccess` / `onError` / `onSettled` callbacks (removed in v5).
 * `onSuccess` fires once per `dataUpdatedAt` advance; `onError` fires once per
 * `errorUpdatedAt` advance.
 */
export function useLegacyQueryCallbacks<TData = unknown, TError = unknown>(
  result: Pick<UseQueryResult<TData, TError>, "data" | "error" | "dataUpdatedAt" | "errorUpdatedAt">,
  extras: LegacyExtras<TData, TError> | undefined
): void {
  const { onSuccess, onError, onSettled } = extras || {};
  const lastSuccessTs = React.useRef<number>(0);
  const lastErrorTs = React.useRef<number>(0);

  React.useEffect(() => {
    if (result.dataUpdatedAt > lastSuccessTs.current && result.data !== undefined) {
      lastSuccessTs.current = result.dataUpdatedAt;
      onSuccess?.(result.data);
      onSettled?.(result.data, result.error);
    }
    // We intentionally depend only on the timestamp so the effect fires once per
    // fetch, regardless of callback identity changes between renders.
  }, [result.dataUpdatedAt]);

  React.useEffect(() => {
    if (result.errorUpdatedAt > lastErrorTs.current && result.error !== null && result.error !== undefined) {
      lastErrorTs.current = result.errorUpdatedAt;
      onError?.(result.error);
      onSettled?.(result.data, result.error);
    }
    // Same dependency strategy as the success effect above.
  }, [result.errorUpdatedAt]);
}

// ---------------------------------------------------------------------------
// Helpers around the QueryClient (object-form translation)
// ---------------------------------------------------------------------------

/** Convert Moon's string-based query id into a v5 QueryKey (always an array). */
export function toQueryKey(id: string): QueryKey {
  return [id];
}

/** Hash a Moon query id consistently with v5's internal hasher. */
export function hashId(id: string): string {
  return hashKey(toQueryKey(id));
}

// Moon generates the queryKey itself, so it doesn't need to be on the options bag passed
// to withDefault* — relax the constraint by dropping it.
type WithDefaultQueryInput<TQueryFnData, TError, TData> = Omit<UseQueryOptions<TQueryFnData, TError, TData>, "queryKey"> &
  LegacyExtras<TData, TError>;

type WithDefaultInfiniteInput<TQueryFnData, TError, TData> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData>,
  "queryKey" | "initialPageParam"
> & {
  initialPageParam?: unknown;
} & LegacyExtras<TData, TError>;

/**
 * Apply the cache client's default options to a partial options bag, after
 * translating Moon's legacy fields (`cacheTime`, `keepPreviousData`).
 */
// `defaultQueryOptions` is typed for the QueryObserverOptions shape; our input
// is the Moon `WithDefault*Input` which is structurally identical at runtime
// after `translateOptions` has stripped the legacy fields. We cast at the
// boundary instead of duplicating TanStack's full generic signature.
type DefaultQueryOptionsArg = Parameters<QueryClient["defaultQueryOptions"]>[0];

export function withDefaultQueryOptions<TData = unknown, TError = unknown, TQueryFnData = TData>(
  client: QueryClient,
  options?: WithDefaultQueryInput<TQueryFnData, TError, TData>
): UseQueryOptions<TQueryFnData, TError, TData> {
  const v5Options = translateOptions(options) || ({} as Omit<WithDefaultQueryInput<TQueryFnData, TError, TData>, LegacyKey>);
  return (client.defaultQueryOptions((v5Options as unknown) as DefaultQueryOptionsArg) as unknown) as UseQueryOptions<
    TQueryFnData,
    TError,
    TData
  >;
}

export function withDefaultInfiniteOptions<TData = unknown, TError = unknown, TQueryFnData = TData>(
  client: QueryClient,
  options?: WithDefaultInfiniteInput<TQueryFnData, TError, TData>
): UseInfiniteQueryOptions<TQueryFnData, TError, TData> {
  const v5Options = translateOptions(options) || ({} as Omit<WithDefaultInfiniteInput<TQueryFnData, TError, TData>, LegacyKey>);
  return (client.defaultQueryOptions((v5Options as unknown) as DefaultQueryOptionsArg) as unknown) as UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData
  >;
}

export function disabledObserverOptions<TData = unknown>(
  client: QueryClient,
  id: string
): QueryObserverOptions<TData> | InfiniteQueryObserverOptions<TData> {
  return (client.defaultQueryOptions<TData, unknown, TData, TData, QueryKey>({
    queryKey: toQueryKey(id),
    enabled: false
  }) as unknown) as QueryObserverOptions<TData>;
}

export async function cancelQueryById(client: QueryClient, id: string): Promise<void> {
  await client.cancelQueries({ queryKey: toQueryKey(id), exact: true });
}

export function getQueryDataById<T = unknown>(client: QueryClient, id: string): T | undefined {
  return client.getQueryData<T>(toQueryKey(id));
}

export function setQueryDataById<T = unknown>(client: QueryClient, id: string, data: T | undefined): void {
  if (data === undefined) {
    // v5 short-circuits `setQueryData(key, undefined)` (no-op). v3 used to clear the entry —
    // preserve that behavior by removing the cached query when callers pass undefined.
    client.removeQueries({ queryKey: toQueryKey(id), exact: true });
    return;
  }
  client.setQueryData<T>(toQueryKey(id), data);
}

export function removeQueryById(client: QueryClient, id: string): void {
  client.removeQueries({ queryKey: toQueryKey(id), exact: true });
}

export async function prefetchQueryById(
  client: QueryClient,
  id: string,
  fetcher: QueryFunction<unknown>,
  options?: LegacyUseQueryOptions
): Promise<void> {
  const v5Options = translateOptions(options) || ({} as Omit<LegacyUseQueryOptions, LegacyKey>);
  await client.prefetchQuery({ ...v5Options, queryKey: toQueryKey(id), queryFn: fetcher } as Parameters<
    typeof client.prefetchQuery
  >[0]);
}

// ---------------------------------------------------------------------------
// Hook wrappers (Moon v4 positional signature → v5 object-form)
// ---------------------------------------------------------------------------

export function useReactQuery<TData = unknown, TError = unknown, TSelected = TData>(
  id: string,
  fetcher: QueryFunction<TData>,
  options: LegacyUseQueryOptions<TData, TError, TSelected>
): UseQueryResult<TSelected, TError> {
  const v5Options = translateOptions(options) || ({} as Omit<LegacyUseQueryOptions<TData, TError, TSelected>, LegacyKey>);
  return rqUseQuery({
    ...v5Options,
    queryKey: toQueryKey(id),
    queryFn: fetcher
  } as Parameters<typeof rqUseQuery>[0]) as UseQueryResult<TSelected, TError>;
}

/**
 * Subscribe to an existing cache entry without triggering a fetch.
 * Used by Moon's observation hooks (`useQueryResult`, `useQueryState`, …)
 * to mirror a query that another component already mounted.
 */
export function useObservedQuery<TData = unknown>(id: string): UseQueryResult<TData> {
  return rqUseQuery({
    queryKey: toQueryKey(id),
    queryFn: () => (undefined as unknown) as TData,
    enabled: false
  }) as UseQueryResult<TData>;
}

export function useReactInfiniteQuery<TData = unknown, TError = unknown, TSelected = TData>(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: QueryFunction<TData, QueryKey, any>,
  options: LegacyUseInfiniteQueryOptions<TData, TError, TSelected>
): UseInfiniteQueryResult<InfiniteDataType<TSelected>, TError> {
  const v5Options = (translateOptions(options) || {}) as Record<string, unknown>;
  // v5 requires `initialPageParam`; default to undefined to mirror v3 first-page behavior.
  if (!("initialPageParam" in v5Options)) {
    v5Options.initialPageParam = undefined;
  }
  // The cast funnel is the price of gluing v5's strict generics to Moon's looser
  // `LegacyUseInfiniteQueryOptions` shape — runtime is fully compatible.
  return (rqUseInfiniteQuery({
    ...(v5Options as Record<string, unknown>),
    queryKey: toQueryKey(id),
    queryFn: fetcher as QueryFunction<TData, QueryKey, never>
  } as Parameters<typeof rqUseInfiniteQuery>[0]) as unknown) as UseInfiniteQueryResult<InfiniteDataType<TSelected>, TError>;
}

/**
 * v5 added a `MutationContext` parameter (`{ client, meta, mutationKey }`) to
 * `mutationFn`, `onSuccess`, `onError` and `onSettled`. Moon v4 / react-query
 * v3 callbacks didn't see it. We wrap the user-supplied callbacks so they keep
 * receiving the v3 signatures.
 */
// Local v3-style callback signatures. The user's `mutationConfig` historically
// expected three positional arguments; v5 introduced a fourth `MutationFunctionContext`
// argument that we strip at the boundary so the user's callback never sees it.
type LegacyOnSuccess<TData, TVariables, TContext> = (data: TData, variables: TVariables, context: TContext) => unknown;
type LegacyOnError<TError, TVariables, TContext> = (
  error: TError,
  variables: TVariables,
  context: TContext | undefined
) => unknown;
type LegacyOnSettled<TData, TError, TVariables, TContext> = (
  data: TData | undefined,
  error: TError | null,
  variables: TVariables,
  context: TContext | undefined
) => unknown;

export function useReactMutation<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>(
  fetcher: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const opts: UseMutationOptions<TData, TError, TVariables, TContext> = options || {};
  const wrappedOptions: UseMutationOptions<TData, TError, TVariables, TContext> = { ...opts };
  if (opts.onSuccess) {
    const userOnSuccess = opts.onSuccess as LegacyOnSuccess<TData, TVariables, TContext>;
    wrappedOptions.onSuccess = (data, variables, onMutateResult) =>
      userOnSuccess(data, variables, onMutateResult) as Promise<unknown> | unknown;
  }
  if (opts.onError) {
    const userOnError = opts.onError as LegacyOnError<TError, TVariables, TContext>;
    wrappedOptions.onError = (error, variables, onMutateResult) =>
      userOnError(error, variables, onMutateResult) as Promise<unknown> | unknown;
  }
  if (opts.onSettled) {
    const userOnSettled = opts.onSettled as LegacyOnSettled<TData, TError, TVariables, TContext>;
    wrappedOptions.onSettled = (data, error, variables, onMutateResult) =>
      userOnSettled(data, error, variables, onMutateResult) as Promise<unknown> | unknown;
  }
  // v5 calls `mutationFn(variables, context)` — wrap to drop the second arg.
  const wrappedFn = (variables: TVariables) => fetcher(variables);
  return rqUseMutation<TData, TError, TVariables, TContext>({ ...wrappedOptions, mutationFn: wrappedFn });
}
