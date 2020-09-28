import { AxiosRequestConfig, AxiosResponse } from "axios";
import { useMutation as useReactMutation, MutationResultPair, MutationConfig } from "react-query";

import { MutateType } from "./moon-client";
import { useMoon } from "./hooks";

export interface IMutationProps<MutationResponse = any, MutationVariables = any> {
  source: string;
  endPoint: string;
  variables: MutationVariables;
  type?: MutateType;
  options?: AxiosRequestConfig;
  mutationConfig?: MutationConfig<MutationResponse, unknown, MutationVariables, unknown>;
}

export default function useMutation<MutationResponse = any, MutationVariables = any>({
  source,
  endPoint,
  type,
  variables,
  options,
  mutationConfig
}: IMutationProps<AxiosResponse<MutationResponse> | undefined, MutationVariables>): MutationResultPair<
  AxiosResponse<MutationResponse> | undefined,
  unknown,
  MutationVariables,
  unknown
> {
  const { client } = useMoon();
  function mutation() {
    return client.mutate<MutationResponse, MutationVariables>(source, endPoint, type, variables, {
      ...options
    });
  }

  return useReactMutation<AxiosResponse<MutationResponse> | undefined, unknown, MutationVariables, unknown>(
    mutation,
    mutationConfig
  );
}
