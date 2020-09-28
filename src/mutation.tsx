import { AxiosResponse } from "axios";
import { MutateFunction, MutationResult } from "react-query";

import { MutateType } from "./moon-client";
import { Nullable } from "./typing";
import useMutation, { IMutationProps } from "./mutation-hook";

export interface IMutationChildrenProps<MutationResponse = any, MutationVariables = any>
  extends MutationResult<MutationResponse, unknown> {
  actions: { mutate: MutateFunction<MutationResponse, unknown, MutationVariables, unknown> };
}

export type MutationChildren<MutationResponse, MutationVariables> = (
  props: IMutationChildrenProps<MutationResponse, MutationVariables>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IMutationComponentProps<MutationResponse, MutationVariables>
  extends IMutationProps<MutationResponse, MutationVariables> {
  children?: MutationChildren<MutationResponse, MutationVariables>;
}

function Mutation<MutationResponse = any, MutationVariables = any>(
  props: IMutationComponentProps<AxiosResponse<MutationResponse> | undefined, MutationVariables>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...mutationProps } = props;
  const [mutate, state] = useMutation<MutationResponse, MutationVariables>(mutationProps);
  return children ? children({ ...state, actions: { mutate } }) : null;
}

Mutation.defaultProps = {
  type: MutateType.Post
};

export default Mutation;
