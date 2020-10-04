import { useMutation as useReactMutation, MutationResultPair, MutationConfig } from "react-query";

import { MutateType } from "./moon-client";
import { useMoon } from "./hooks";

export interface IMutationProps<
  MutationVariables = any,
  MutationResponse = any,
  MutationError = any,
  MutationClientConfig = any
> {
  source: string;
  endPoint?: string;
  variables?: MutationVariables;
  type?: MutateType;
  options?: MutationClientConfig;
  mutationConfig?: MutationConfig<MutationResponse, MutationError, MutationVariables, unknown>;
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
}: IMutationProps<MutationVariables, MutationResponse | undefined, MutationError, MutationClientConfig>): MutationResultPair<
  MutationResponse | undefined,
  MutationError,
  MutationVariables,
  unknown
> {
  const { client } = useMoon();
  function mutation() {
    return client.mutate<MutationVariables, MutationResponse, MutationClientConfig>(source, endPoint, type, variables, options);
  }

  return useReactMutation<MutationResponse | undefined, MutationError, MutationVariables, unknown>(mutation, mutationConfig);
}
