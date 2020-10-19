import { UseMutationResult } from "react-query";

import { MutateType } from "./moon-client";
import { Nullable } from "./typing";
import useMutation, { IMutationProps } from "./useMutation";

export interface IMutationChildrenProps<MutationVariables = any, MutationResponse = any, MutationError = any>
  extends Omit<
    UseMutationResult<MutationResponse | undefined, MutationError, MutationVariables>,
    "mutate" | "mutateAsync" | "reset"
  > {
  actions: Pick<UseMutationResult<MutationResponse | undefined, MutationError, MutationVariables>, "reset"> & {
    mutate: () => void;
    mutateAsync: () => Promise<MutationResponse>;
  };
}

export type MutationChildren<MutationVariables, MutationResponse, MutationError> = (
  props: IMutationChildrenProps<MutationVariables, MutationResponse, MutationError>
  // eslint-disable-next-line no-undef
) => Nullable<JSX.Element>;

export interface IMutationComponentProps<MutationVariables, MutationResponse, MutationError, MutationConfig>
  extends IMutationProps<MutationVariables, MutationResponse, MutationError, MutationConfig> {
  children?: MutationChildren<MutationVariables, MutationResponse, MutationError>;
}

function Mutation<MutationVariables = any, MutationResponse = any, MutationError = any, MutationConfig = any>(
  props: IMutationComponentProps<MutationVariables, MutationResponse | undefined, MutationError, MutationConfig>
  // eslint-disable-next-line no-undef
): Nullable<JSX.Element> {
  const { children, ...mutationProps } = props;
  const [state, actions] = useMutation<MutationVariables, MutationResponse, MutationError, MutationConfig>(mutationProps);
  return children ? children({ ...state, actions }) : null;
}

Mutation.defaultProps = {
  type: MutateType.Post
};

export default Mutation;
