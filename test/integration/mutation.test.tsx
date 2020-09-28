/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { cleanup, render, wait, fireEvent } from "@testing-library/react";

import MoonProvider from "../../src/moon-provider";
import Mutation from "../../src/mutation";
import { links } from "../moon-client.test";
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
          {({ actions: { mutate }, data }) => {
            return data && data.status ? (
              <span>Success</span>
            ) : (
              <div id="button" onClick={() => mutate()}>
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
          {({ data, error, actions: { mutate } }) => {
            const result = data ? (
              <span id="response">{data.status && "Success"}</span>
            ) : (
              <div id="button" onClick={() => mutate()}>
                Go
              </div>
            );
            //@ts-ignore
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
