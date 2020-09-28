/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { render, fireEvent, wait } from "@testing-library/react";

import MoonProvider from "../../src/moon-provider";
import { FetchPolicy } from "../../src/query-hook";
import Query from "../../src/query";
import { links } from "../moon-client.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";

interface QueryData {
  users: { id: number; name: string }[];
}

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
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links}>
        <Query<QueryData, QueryVariables> id="query1" source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
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
    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
  });

  test("should render the list of users (controlled fetch)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links}>
        <Query<QueryData, QueryVariables>
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

    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(0);
  });

  test("should render an error", async () => {
    const error = "Bimm!";
    const get = jest.fn().mockImplementation(() => Promise.reject(error));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links}>
        <Query<QueryData, QueryVariables>
          id="query3"
          source="FOO"
          endPoint="/users"
          variables={{ foo: "bar" }}
          queryConfig={{
            retry: 0
          }}
        >
          {({ data, error }) => {
            const users = data
              ? data.data.users.map(user => {
                  return <span key={user.name}>{user.name}</span>;
                })
              : null;
            return error ? <span>{error as string}</span> : <div>{users}</div>;
          }}
        </Query>
      </MoonProvider>
    );
    await wait(() => container.querySelector("span"));
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/Bimm!/)).toBeTruthy();
  });

  test("should render the list of users (controlled fetch with cache)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links} hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}>
        <Query<QueryData, QueryVariables>
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

    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });

  test("should render the list of users (controlled fetch with network only)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links} hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}>
        <Query<QueryData, QueryVariables>
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

    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });

  test("should render the list of users (controlled fetch with network only)", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { container, getByText } = render(
      <MoonProvider links={links} hydrate={{ state: { queries: [{ queryKey: "query4", data: cachedResponse }] } }}>
        <Query<QueryData, QueryVariables>
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

    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    // only Johan Smith
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();
    expect(container.querySelectorAll("#button")).toHaveLength(1);
  });
});
