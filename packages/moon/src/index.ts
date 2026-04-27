// Re-export the underlying cache library through the compat layer.
// `compat` exposes both v5's native names AND the backward-compatible aliases
// that Moon v4 / react-query v3 callers depended on (`Hydrate`, `hashQueryKey`,
// `HydrateProps`).
export * from "./compat";

export { default as MoonClient } from "./moonClient";
export * from "./moonClient";

export { default as MoonProvider } from "./moonProvider";
export * from "./moonProvider";

export { default as Query } from "./query";
export * from "./query";

export { default as useQuery } from "./useQuery";
export * from "./useQuery";

export { default as usePrefetchQuery } from "./usePrefetchQuery";
export * from "./usePrefetchQuery";

export { default as Mutation } from "./mutation";
export * from "./mutation";

export { default as useMutation } from "./useMutation";
export * from "./useMutation";

export { default as InfiniteQuery } from "./infiniteQuery";
export * from "./infiniteQuery";

export { default as useInfiniteQuery } from "./useInfiniteQuery";
export * from "./useInfiniteQuery";

export * from "./utils";
export * from "./hooks";
