import { useMutation as useReactMutation, MutationResultPair, MutationConfig } from "react-query";

import { MutateType } from "./moon-client";
import { useMoon } from "./hooks";

export interface IMutationProps<
  MutationVariables = any,
  MutationResponse = any,
  MutationError = any,
  MutationClientConfig = any
> {
  /** The link id of the http client */
  source: string;
  /** The REST end point */
  endPoint?: string;
  /** The variables of your mutation */
  variables?: MutationVariables;
  /** The mutation method. Default value:  MutateType.Post */
  type?: MutateType;
  /** The http client options of your mutation. */
  options?: MutationClientConfig;
  /** The react-query config. Please see the react-query MutationConfig for more details. */
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
