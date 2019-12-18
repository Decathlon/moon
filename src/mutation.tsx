import * as React from "react";
import { AxiosResponse } from "axios";

import { MutateType } from "./moon-client";
import useMutation, { IMutationActions, IMutationState, IMutationProps } from "./mutation-hook";
import { Nullable } from "./typing";

export type MutationChildren<MutationResponse> = (
  props: IMutationChildrenProps<MutationResponse>
) => Nullable<JSX.Element | JSX.Element[]>;

export interface IMutationChildrenProps<MutationResponse = any> extends IMutationState<MutationResponse> {
  actions: IMutationActions;
}

interface IDumbMutationProps<MutationResponse = any> extends IMutationChildrenProps<MutationResponse> {
  children?: MutationChildren<MutationResponse>;
}

export interface IMutationComponentProps<MutationResponse, MutationVariables>
  extends IMutationProps<MutationResponse, MutationVariables> {
  children?: MutationChildren<MutationResponse>;
}

// @ts-ignore ignore children type
export const DumbMutation = React.memo(function DumbMutation<MutationResponse>(props: IDumbMutationProps<MutationResponse>) {
  const { children, ...childrenProps } = props;
  return children ? children({ ...childrenProps }) : null;
});

function Mutation<MutationResponse = AxiosResponse<any>, MutationVariables = any>(
  props: IMutationComponentProps<MutationResponse, MutationVariables>
) {
  const { children, ...mutationProps } = props;
  const [state, actions] = useMutation(mutationProps);
  return (
    <DumbMutation<MutationResponse> actions={actions} {...state}>
      {children}
    </DumbMutation>
  );
}

Mutation.defaultProps = {
  type: MutateType.Post
};

export default Mutation;
