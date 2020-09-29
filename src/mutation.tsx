import { MutateFunction, MutationResult } from "react-query";

import { MutateType } from "./moon-client";
import { Nullable } from "./typing";
import useMutation, { IMutationProps } from "./mutation-hook";

export interface IMutationChildrenProps<MutationVariables = any, MutationResponse = any, MutationError = any>
  extends MutationResult<MutationResponse, MutationError> {
  actions: { mutate: MutateFunction<MutationResponse, MutationError, MutationVariables> };
}

export type MutationChildren<MutationVariables, MutationResponse, MutationError> = (
  props: IMutationChildrenProps<MutationVariables, MutationResponse, MutationError>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IMutationComponentProps<MutationVariables, MutationConfig, MutationResponse, MutationError>
  extends IMutationProps<MutationVariables, MutationConfig, MutationResponse> {
  children?: MutationChildren<MutationVariables, MutationResponse, MutationError>;
}

function Mutation<MutationVariables = any, MutationConfig = any, MutationResponse = any, MutationError = any>(
  props: IMutationComponentProps<MutationVariables, MutationConfig, MutationResponse | undefined, MutationError>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...mutationProps } = props;
  const [mutate, state] = useMutation<MutationVariables, MutationConfig, MutationResponse, MutationError>(mutationProps);
  return children ? children({ ...state, actions: { mutate } }) : null;
}

Mutation.defaultProps = {
  type: MutateType.Post
};

export default Mutation;
