import * as React from "react";
import { AxiosResponse } from "axios";

import { IMoonContextValue, MoonContext } from "./moonProvider";
import { MutateType } from "./moonClient";

interface IChildren<MutationResponse = any> {
  mutate?: () => void;
  response?: MutationResponse;
  loading?: boolean;
  error?: any;
}

export interface IMutationProps<MutationResponse = any, MutationVariables = any> {
  source: string;
  endPoint: string;
  variables?: MutationVariables;
  type?: MutateType;
  children?: (props: IChildren<MutationResponse>) => React.ReactNode;
  onResponse?: (response: MutationResponse) => void;
  onError?: (error: any) => void;
}

interface IProps<MutationResponse = any, MutationVariables = any>
  extends IMutationProps<MutationResponse, MutationVariables>,
    IMoonContextValue {}

interface IState<MutationResponse = any> {
  loading: boolean;
  error: any;
  response?: MutationResponse;
}

export class DumbMutation<MutationResponse = AxiosResponse<any>, MutationVariables = any> extends React.PureComponent<
  IProps<MutationResponse, MutationVariables>,
  IState<MutationResponse>
> {
  static defaultProps = {
    type: MutateType.Post
  };

  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
      error: null
    };
  }

  private mutate = () => {
    const { client, source, type, endPoint, variables, onResponse, onError } = this.props;

    this.setState({ response: undefined, loading: true, error: null }, async () => {
      try {
        // @ts-ignore API context initialized to null
        const response: MutationResponse | undefined = ((await client.mutate(
          source,
          endPoint,
          type,
          variables
        )) as unknown) as MutationResponse;
        this.setState({ loading: false, response }, () => {
          if (onResponse) {
            onResponse(response);
          }
        });
      } catch (err) {
        this.setState({ error: err, loading: false }, () => {
          if (onError) {
            onError(err);
          }
        });
      }
    });
  };

  public render() {
    const { children } = this.props;
    const { loading, error, response } = this.state;
    return children ? children({ mutate: this.mutate, response, loading, error }) : null;
  }
}

export default class Mutation<MutationResponse = any, MutationVariables = any> extends React.PureComponent<
  IMutationProps<MutationResponse, MutationVariables>
> {
  render() {
    return (
      <MoonContext.Consumer>
        {({ client }) => <DumbMutation<MutationResponse, MutationVariables> client={client} {...this.props} />}
      </MoonContext.Consumer>
    );
  }
}
