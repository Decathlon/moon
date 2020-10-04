/* eslint-disable max-classes-per-file */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";

import MoonProvider from "../../src/moon-provider";
import { FetchPolicy } from "../../src/query-hook";
import Query from "../../src/query";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  foo: string;
}

const cachedResponse = {
  data: { users: [{ id: 2, name: "Alice Smith" }] }
};

const response = {
  data: { users: [{ id: 1, name: "John Smith" }] }
};

describe("Query component with MoonProvider", () => {
  test("should render the list of users", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <Query<QueryVariables, typeof response, any, MockedClientConfig>
          id="query1"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
        >
          {({ data }) => {
            return (
              <div>
                {data
                  ? data.data.users.map(user => {
                      return <span key={user.name}>{user.name}</span>;
                    })
                  : null}
              </div>
            );
          }}
        </Query>
      </MoonProvider>
    );
    await waitFor(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
  });

  test("should render the list of users (controlled fetch)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <Query<QueryVariables, typeof response, any, MockedClientConfig>
          id="query2"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          queryConfig={{ enabled: false }}
        >
          {({ data, actions: { refetch } }) => {
            return data ? (
              <div>
                {data.data.users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })}
              </div>
            ) : (
              <div id="button" onClick={() => refetch()}>
                Go
              </div>
            );
          }}
        </Query>
      </MoonProvider>
    );

    expect(get).toHaveBeenCalledTimes(0);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await waitFor(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);
  });

  test("should render an error", async () => {
    const error = "Bimm!";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <Query<QueryVariables, typeof response, string, MockedClientConfig>
          id="query3"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          queryConfig={{
            retry: false
          }}
        >
          {({ data, error }) => {
            const users = data
              ? data.data.users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })
              : null;
            return error ? <span>{error}</span> : <div>{users}</div>;
          }}
        </Query>
      </MoonProvider>
    );
    await waitFor(() => container.querySelector("span"));
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/Bimm!/)).toBeTruthy();
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider
        links={links}
        clientFactory={clientFactory}
        hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}
      >
        <Query<QueryVariables, typeof response, any, MockedClientConfig>
          id="query4"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          queryConfig={{ enabled: false }}
        >
          {({ data, actions: { refetch } }) => {
            const users = data ? data.data.users : [];
            return (
              <div>
                {users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })}
                <div id="button" onClick={() => refetch()}>
                  Go
                </div>
              </div>
            );
          }}
        </Query>
      </MoonProvider>
    );

    expect(get).toHaveBeenCalledTimes(0);
    expect(getByText(/Alice/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await waitFor(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });

  test("should render the list of users (controlled fetch with network only)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider
        links={links}
        clientFactory={clientFactory}
        hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}
      >
        <Query<QueryVariables, typeof response, any, MockedClientConfig>
          id="query4"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          fetchPolicy={FetchPolicy.NetworkOnly}
          queryConfig={{ enabled: false }}
        >
          {({ data, actions: { refetch } }) => {
            const users = data?.data?.users || [];
            return (
              <div>
                {users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })}
                <div id="button" onClick={() => refetch()}>
                  Go
                </div>
              </div>
            );
          }}
        </Query>
      </MoonProvider>
    );

    expect(get).toHaveBeenCalledTimes(0);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await waitFor(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });

  test("should render the list of users (controlled fetch with network only)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider
        links={links}
        clientFactory={clientFactory}
        hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}
      >
        <Query<QueryVariables, typeof response, any, MockedClientConfig>
          id="query4"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          fetchPolicy={FetchPolicy.NetworkOnly}
          queryConfig={{ enabled: false }}
        >
          {({ data, actions: { refetch } }) => {
            const users = data?.data?.users || [];
            return (
              <div>
                {users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })}
                <div id="button" onClick={() => refetch()}>
                  Go
                </div>
              </div>
            );
          }}
        </Query>
      </MoonProvider>
    );

    expect(get).toHaveBeenCalledTimes(0);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.querySelectorAll("#button")).toHaveLength(1);
    fireEvent.click(container.querySelectorAll("#button")[0]);

    await waitFor(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });
});
