# Changelog

## 5.0.0 — TanStack Query v5 + React 18

### Why use Moon (avant / après)

The wrapper exists to take the pain out of plumbing TanStack Query into
multiple HTTP sources. The two snippets below show the same setup — three
REST sources behind a shared auth interceptor, then a query against one of
them.

#### Without Moon (raw `@tanstack/react-query` + axios)

```tsx
import axios from "axios";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

function withAuth(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use(c => ({
    ...c,
    headers: { ...c.headers, Authorization: `Bearer ${getToken()}` }
  }));
  return instance;
}

const fooClient = withAuth(axios.create({ baseURL: "https://foo.com" }));
const barClient = withAuth(axios.create({ baseURL: "https://bar.com" }));
const bazClient = withAuth(axios.create({ baseURL: "https://baz.com" }));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
);

const MyComponent = () => {
  const variables = { page: 1 };
  const { data, isLoading, error } = useQuery({
    queryKey: ["foo-users", variables],
    queryFn: ({ signal }) =>
      fooClient.get("/users", { params: variables, signal }).then(r => r.data)
  });
  // …
};
```

#### With Moon

```tsx
import { MoonProvider, useQuery } from "@pricemoov-oss/moon";
import axiosClientFactory from "@pricemoov-oss/moon-axios";

const setAuth = config => ({
  ...config,
  headers: { ...config.headers, Authorization: `Bearer ${getToken()}` }
});

const links = [
  { id: "FOO", config: { baseURL: "https://foo.com" }, interceptors: { request: [{ onFulfilled: setAuth }] } },
  { id: "BAR", config: { baseURL: "https://bar.com" }, interceptors: { request: [{ onFulfilled: setAuth }] } },
  { id: "BAZ", config: { baseURL: "https://baz.com" }, interceptors: { request: [{ onFulfilled: setAuth }] } }
];

const App = () => (
  <MoonProvider links={links} clientFactory={axiosClientFactory}>
    <MyComponent />
  </MoonProvider>
);

const MyComponent = () => {
  const [{ data, isLoading, error }] = useQuery({
    source: "FOO",
    endPoint: "/users",
    variables: { page: 1 }
  });
  // …
};
```

What Moon takes off your plate:

- `clientFactory` builds one HTTP instance per `link.id` so multiple sources
  share the same configuration shape.
- `interceptors` are declared per link, in plain config — no manual call to
  `instance.interceptors.request.use(...)`.
- `queryKey` is generated automatically from `{ source, endPoint, variables }`
  so two components with the same params share the cache without coordination.
- `fetchPolicy` (`cache-first` / `cache-and-network` / `network-only`) maps
  TanStack's stale-while-revalidate model onto the Apollo-style policies
  developers already know.

The same `links` array also works with `@pricemoov-oss/moon-graphql` — swap
`axiosClientFactory` for the GraphQL one and your REST hooks become GraphQL
hooks with no other change.

---


### `@pricemoov-oss/moon` 4.6.0 → 5.0.0
### `@pricemoov-oss/moon-axios` 1.2.0 → 2.0.0
### `@pricemoov-oss/moon-graphql` 1.1.0 → 2.0.0

This release modernizes the entire stack while keeping Moon's public API
identical. Existing applications should not need to change a single line of
Moon code — only the peer dependencies they install.

### What changed under the hood

- **`react-query@3.23` → `@tanstack/react-query@5.x`** (the package is now
  published under the `@tanstack` scope and Moon depends on the v5 line).
- **React peer**: `^17.0.1` → `^18.0.0 || ^19.0.0` (TanStack Query v5
  requires React 18+).
- **Axios peer (`moon-axios`)**: `~0.20` → `^1.0.0`. The `paramsSerializer`
  function form is still accepted; it is normalized internally to the
  `{ serialize }` shape that axios 1.x expects.
- **graphql-request peer (`moon-graphql`)**: `~3.4.0` → `^7.0.0`.
- **TypeScript**: 4.0 → 5.x (`target` raised from `es5` to `es2020`,
  required by the new TanStack core which uses private class fields).
- **Test stack**: `jest@26 + ts-jest@26 + @testing-library/react-hooks` →
  `jest@29 + ts-jest@29 + @testing-library/react@14` (which now ships
  `renderHook` natively — `@testing-library/react-hooks` is no longer
  needed).
- All Moon source files now go through a single `compat.ts` module which
  centralises every interaction with the underlying cache library — future
  TanStack Query major bumps will only touch this one file.

### Public API contract — what stays exactly the same

- The full surface of `useQuery`, `useMutation`, `useInfiniteQuery`,
  `usePrefetchQuery`, `Query`, `Mutation`, `InfiniteQuery`, `MoonProvider`,
  `MoonClient`, `MutateType`, `FetchPolicy`, `withMoon`, `withQueryResult`,
  `withQueriesResults`, `useMoon`, `useQueryResult`, `useQueriesResults`,
  `useQueryState`, `useQueriesStates`, `getQueryId` is preserved.
- `actions.refetch`, `actions.cancel` and `actions.remove` keep working
  exactly like before. Moon now provides `actions.remove` itself (TanStack
  Query v5 removed `remove` from `useQuery` results).
- `queryConfig` keeps accepting `onSuccess` / `onError` / `onSettled` /
  `cacheTime` / `keepPreviousData` even though TanStack Query v5 removed
  them — Moon translates them at runtime:
  - `cacheTime` → `gcTime`
  - `keepPreviousData: true` → `placeholderData: keepPreviousData`
  - `onSuccess` / `onError` / `onSettled` are wired to the result via
    a `useEffect` that fires once per `dataUpdatedAt` / `errorUpdatedAt`
    advance — semantically equivalent to react-query v3 for 99% of
    real-world usages.
- `mutationConfig` callbacks (`onSuccess`, `onError`, `onSettled`,
  `mutationFn`) keep their react-query v3 signatures. The new v5 4th
  argument (the `MutationContext`) is stripped at the boundary.
- The previously-exported names `Hydrate` (now backed by
  `HydrationBoundary`), `hashQueryKey` (now backed by `hashKey`) and
  `HydrateProps` are preserved as backward-compatible aliases.

### Breaking changes (the unavoidable ones)

The single breaking change for consumers is the **React 18+ requirement**
imposed by TanStack Query v5. Apps still on React 17 cannot upgrade to
Moon 5; pin `@pricemoov-oss/moon@^4.6.0` if you cannot bump React yet.

### Bug fixes also shipped

- `moon-graphql`: response interceptors `onRejected` are now actually
  called when a query rejects (previously the rejection branch invoked
  `onFulfilled` due to a missing `isRejected` flag).
- `MoonClient.query` / `MoonClient.mutate` no longer return a deceptively
  named `new Promise(reject => reject(...))` (the variable name was
  misleading; behaviour is preserved as a resolved-undefined promise).

### Test coverage added (regression net for the migration)

- `useInfiniteQuery` / `InfiniteQuery`: pagination, refetch on variable
  change, cancel, component rendering.
- `useQuery` legacy `queryConfig`: `onSuccess`, `onError`, `onSettled`,
  `cacheTime`, `keepPreviousData`, `actions.remove`.
- `useMutation`: `dynamicMutate`, `dynamicMutateAsync`, `MutateType.Patch`.
- `moon-axios`: interceptors registration, default and custom
  `paramsSerializer`, cancellation, mutation routing.
- `moon-graphql`: request/response interceptors (success and error),
  cancellation, mutation routing through `query()`.

Total: **106 tests, all green**.
