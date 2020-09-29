import { useMutation as useReactMutation, MutationResultPair, MutationConfig } from "react-query";

import { MutateType } from "./moon-client";
import { useMoon } from "./hooks";

export interface IMutationProps<MutationVariables = any, MutationConfg = any, MutationResponse = any> {
  source: string;
  endPoint: string;
  variables: MutationVariables;
  type?: MutateType;
  options?: MutationConfg;
  mutationConfig?: MutationConfig<MutationResponse, unknown, MutationVariables, unknown>;
}

export default function useMutation<MutationVariables = any, MutationConfg = any, MutationResponse = any>({
  source,
  endPoint,
  type,
  variables,
  options,
  mutationConfig
}: IMutationProps<MutationVariables, MutationConfg, MutationResponse | undefined>): MutationResultPair<
  MutationResponse | undefined,
  unknown,
  MutationVariables,
  unknown
> {
  const { client } = useMoon();
  function mutation() {
    return client.mutate<MutationVariables, MutationConfg, MutationResponse>(source, endPoint, type, variables, options);
  }

  return useReactMutation<MutationResponse | undefined, unknown, MutationVariables, unknown>(mutation, mutationConfig);
}
