import * as React from "react";
import { useMutation as useReactMutation, UseMutationResult, MutationOptions } from "react-query";

import { MutateType } from "./moonClient";
import { useMoon } from "./hooks";

export type IMutationResultProps<MutationResponse, MutationError, MutationVariables> = [
  Omit<UseMutationResult<MutationResponse | undefined, MutationError, MutationVariables>, "mutate" | "mutateAsync" | "reset">,
  Pick<UseMutationResult<MutationResponse | undefined, MutationError, MutationVariables>, "reset"> & {
    mutate: () => void;
    mutateAsync: () => Promise<MutationResponse>;
    dynamicMutate: (variables: MutationVariables) => void;
    dynamicMutateAsync: (variables: MutationVariables) => Promise<MutationResponse>;
  }
];

export interface IMutationProps<
  MutationVariables = any,
  MutationResponse = any,
  MutationError = any,
  MutationClientConfig = any
> {
  /** The link id of the http client */
  source?: string;
  /** The REST end point */
  endPoint?: string;
  /** The variables of your mutation */
  variables?: MutationVariables;
  /** The mutation method. Default value:  MutateType.Post */
  type?: MutateType;
  /** The http client options of your mutation. */
  options?: MutationClientConfig;
  /** The react-query config. Please see the react-query MutationConfig for more details. */
  mutationConfig?: MutationOptions<MutationResponse, MutationError, MutationVariables | undefined, unknown>;
}

export default function useMutation<
  MutationVariables = any,
  MutationResponse = any,
  MutationError = any,
  MutationClientConfig = any
>({
  source,
  endPoint,
  type,
  variables,
  options,
  mutationConfig
}: IMutationProps<MutationVariables, MutationResponse | undefined, MutationError, MutationClientConfig>): IMutationResultProps<
  MutationResponse | undefined,
  MutationError,
  MutationVariables | undefined
> {
  const { client } = useMoon();
  function mutation() {
    return client.mutate<MutationVariables, MutationResponse, MutationClientConfig>(source, endPoint, type, variables, options);
  }

  const { mutate: reactQueryMutate, mutateAsync: reactQueryMutateAsync, reset, ...others } = useReactMutation<
    MutationResponse | undefined,
    MutationError,
    MutationVariables | undefined,
    unknown
  >(mutation, mutationConfig);

  const mutate = React.useCallback(() => {
    return reactQueryMutate(variables);
  }, [variables]);

  const mutateAsync = React.useCallback(() => {
    return reactQueryMutateAsync(variables);
  }, [variables]);

  return [others, { mutate, mutateAsync, reset, dynamicMutate: reactQueryMutate, dynamicMutateAsync: reactQueryMutateAsync }];
}
