import * as React from "react";

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
  onResponse?: (response: MutationResponse) => void;
  onError?: (error: any) => void;
}

export default function useMutation<MutationResponse = any, MutationVariables = any>({
  source,
  type,
  endPoint,
  variables,
  onResponse,
  onError
}: IMutationHookProps<MutationResponse, MutationVariables>): [IMutationData<MutationResponse>, () => void] {
  const { client } = useMoonClient();
  const [error, setError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [response, setResponse] = React.useState<MutationResponse | undefined>(undefined);

  const mutate = async () => {
    setError(null);
    setLoading(true);
    setResponse(undefined);
    try {
      // @ts-ignore API context initialized to null
      const response: MutationResponse = ((await client.mutate(
        source,
        endPoint,
        type,
        variables
      )) as unknown) as MutationResponse;
      setLoading(false);
      setResponse(response);
      if (onResponse) {
        onResponse(response);
      }
    } catch (err) {
      setLoading(false);
      setError(err);
      if (onError) {
        onError(err);
      }
    }
  };

  return [{ response, loading, error }, mutate];
}
