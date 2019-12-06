// / <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { cleanup, render, wait, fireEvent } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import Mutation from "../../src/mutation";
import { links } from "../moonClient.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";

interface MutationResponse {
  status: boolean;
}

interface MutationVariables {
  foo: string;
}

describe("Mutation component with MoonProvider", () => {
  test("should call the mutate action", async () => {
    const response = {
      status: true
    };
    const post = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.post = post;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const { container, getByText } = render(
      <MoonProvider links={links}>
        <Mutation<MutationResponse, MutationVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ mutate, response }) => {
            return response && response.status ? (
              <span>Success</span>
            ) : (
              <div id="button" onClick={mutate}>
                Go
              </div>
            );
          }}
        </Mutation>
      </MoonProvider>
    );

    expect(post).toHaveBeenCalledTimes(0);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await wait(() => container.querySelector("span"));

    expect(post).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/Success/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);

    cleanup();
  });

  test("should render an error", async () => {
    const error = new Error("Bimm!");

    const post = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.post = post;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);
    const { container, getByText } = render(
      <MoonProvider links={links}>
        <Mutation<MutationResponse, MutationVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ response, mutate, error }) => {
            const result = response ? (
              <span id="response">{response.status && "Success"}</span>
            ) : (
              <div id="button" onClick={mutate}>
                Go
              </div>
            );
            return error ? <span>{error.message}</span> : result;
          }}
        </Mutation>
      </MoonProvider>
    );

    expect(post).toHaveBeenCalledTimes(0);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await wait(() => container.querySelector("span"));

    expect(post).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(container.querySelectorAll("#response")).toHaveLength(0);
    expect(getByText(/Bimm!/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);

    cleanup();
  });
});
