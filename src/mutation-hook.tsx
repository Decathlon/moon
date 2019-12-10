import * as React from "react";
import StaticAxios, { AxiosRequestConfig, CancelTokenSource } from "axios";

import { MutateType, useMoonClient } from "./moonClient";
import { Nullable } from "./typing";

export interface IMutationData<MutationResponse = any> {
  response?: Nullable<MutationResponse>;
  loading: boolean;
  error: any;
}

export interface IMutationHookProps<MutationResponse = any, MutationVariables = any> {
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
}: IMutationHookProps<MutationResponse, MutationVariables>): [IMutationData<MutationResponse>, () => void] {
  const { client } = useMoonClient();
  const [error, setError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [response, setResponse] = React.useState<MutationResponse | undefined>(undefined);
  const cancelSourceRef = React.useRef<CancelTokenSource>();

  React.useEffect(() => {
    cancelSourceRef.current = StaticAxios.CancelToken.source();
    // @ts-ignore can't be undefined
    return () => cancelSourceRef.current.cancel();
  }, [variables, endPoint, source]);

  const mutate = async () => {
    setError(null);
    setLoading(true);
    setResponse(undefined);
    try {
      // @ts-ignore API context initialized to null
      const response: MutationResponse = ((await client.mutate(source, endPoint, type, variables, {
        ...options,
        cancelToken: cancelSourceRef.current && cancelSourceRef.current.token
      })) as unknown) as MutationResponse;
      setLoading(false);
      setResponse(response);
      if (onResponse) {
        onResponse(response);
      }
    } catch (err) {
      if (StaticAxios.isCancel(err)) {
        return;
      }
      setLoading(false);
      setError(err);
      if (onError) {
        onError(err);
      }
    }
  };

  return [{ response, loading, error }, mutate];
}
