import * as React from "react";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";

import { MutateType } from "./moon-client";
import { usePrevValue, useMoon } from "./hooks";
import { Nullable } from "./typing";

export interface IMutationActions {
  mutate: () => void;
  cancel: () => void;
}

export interface IMutationData<MutationResponse = any> {
  response?: Nullable<MutationResponse>;
  loading: boolean;
  error: any;
}

export interface IMutationState<MutationResponse = any> {
  loading: boolean;
  error: any;
  response?: MutationResponse;
}

export interface IMutationProps<MutationResponse = any, MutationVariables = any> {
  source: string;
  endPoint: string;
  variables?: MutationVariables;
  type?: MutateType;
  options?: AxiosRequestConfig;
  onResponse?: (response: MutationResponse) => void;
  onError?: (error: any) => void;
}

export default function useMutation<MutationResponse = any, MutationVariables = any>({
  source,
  type,
  endPoint,
  variables,
  options,
  onResponse,
  onError
}: IMutationProps<MutationResponse, MutationVariables>): [IMutationData<MutationResponse>, IMutationActions] {
  const { client } = useMoon();
  const { value } = usePrevValue(variables);
  const [state, setState] = React.useState<IMutationState<MutationResponse>>({
    response: undefined,
    loading: false,
    error: null
  });
  const cancelSourceRef = React.useRef<CancelTokenSource>();
  const { response, loading, error } = state;

  React.useEffect(() => {
    cancelSourceRef.current = StaticAxios.CancelToken.source();
    // @ts-ignore can't be undefined
    return () => cancelSourceRef.current.cancel();
  }, [value, endPoint, source]);

  const cancel = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
      setState({ ...state, loading: false });
    }
  };

  const mutate = async () => {
    setState({ ...state, loading: true, error: null, response: undefined });
    try {
      const response: MutationResponse = ((await client.mutate(source, endPoint, type, variables, {
        ...options,
        cancelToken: cancelSourceRef.current && cancelSourceRef.current.token
      })) as unknown) as MutationResponse;
      setState({ ...state, loading: false, response });

      if (onResponse) {
        onResponse(response);
      }
    } catch (err) {
      if (StaticAxios.isCancel(err)) {
        return;
      }
      setState({ ...state, loading: false, error: err });
      if (onError) {
        onError(err);
      }
    }
  };

  return [
    { response, loading, error },
    { mutate, cancel }
  ];
}
