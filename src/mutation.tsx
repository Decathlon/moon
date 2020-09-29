import { MutateFunction, MutationResult } from "react-query";

import { MutateType } from "./moon-client";
import { Nullable } from "./typing";
import useMutation, { IMutationProps } from "./mutation-hook";

export interface IMutationChildrenProps<MutationVariables = any, MutationResponse = any>
  extends MutationResult<MutationResponse, unknown> {
  actions: { mutate: MutateFunction<MutationResponse, unknown, MutationVariables, unknown> };
}

export type MutationChildren<MutationVariables, MutationResponse> = (
  props: IMutationChildrenProps<MutationVariables, MutationResponse>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IMutationComponentProps<MutationVariables, MutationConfig, MutationResponse>
  extends IMutationProps<MutationVariables, MutationConfig, MutationResponse> {
  children?: MutationChildren<MutationVariables, MutationResponse>;
}

function Mutation<MutationVariables = any, MutationConfig = any, MutationResponse = any>(
  props: IMutationComponentProps<MutationVariables, MutationConfig, MutationResponse | undefined>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...mutationProps } = props;
  const [mutate, state] = useMutation<MutationVariables, MutationConfig, MutationResponse>(mutationProps);
  return children ? children({ ...state, actions: { mutate } }) : null;
}

Mutation.defaultProps = {
  type: MutateType.Post
};

export default Mutation;
