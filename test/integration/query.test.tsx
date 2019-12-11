/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { Provider } from "react-redux";
import { cleanup, render, fireEvent, wait } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import { FetchPolicy } from "../../src/query-hook";
import Query from "../../src/query";
import { links } from "../moonClient.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";
import { createMoonStore } from "../../src/redux";

interface QueryData {
  users: { id: number; name: string }[];
}

interface QueryVariables {
  foo: string;
}

const cachedResponse = {
  users: [{ id: 2, name: "Alice Smith" }]
};

const response = {
  users: [{ id: 1, name: "John Smith" }]
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
            return data
              ? data.users.map(user => {
                  return <span>{user.name}</span>;
                })
              : null;
          }}
        </Query>
      </MoonProvider>
    );
    await wait(() => container.querySelector("span"));

    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/John Smith/)).toBeTruthy();

    cleanup();
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
          fetchOnMount={false}
        >
          {({ data, actions: { refetch } }) => {
            return data ? (
              data.users.map(user => {
                return <span>{user.name}</span>;
              })
            ) : (
              <div id="button" onClick={refetch}>
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

    cleanup();
  });

  test("should render an error", async () => {
    const error = new Error("Bimm!");

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
        <Query<QueryData, QueryVariables> id="query3" source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
          {({ data, error }) => {
            const users = data
              ? data.users.map(user => {
                  return <span>{user.name}</span>;
                })
              : null;
            return error ? <span>{error.message}</span> : users;
          }}
        </Query>
      </MoonProvider>
    );
    await wait(() => container.querySelector("span"));
    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(getByText(/Bimm!/)).toBeTruthy();

    cleanup();
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
    const store = createMoonStore({ queriesResult: { query4: cachedResponse } });
    const { container, getByText } = render(
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          <Query<QueryData, QueryVariables>
            id="query4"
            source="FOO"
            endPoint="/users"
            variables={{ foo: "bar" }}
            fetchOnMount={false}
          >
            {({ data, actions: { refetch } }) => {
              const users = data ? data.users : [];
              return (
                <div>
                  {users.map(user => {
                    return <span>{user.name}</span>;
                  })}
                  <div id="button" onClick={refetch}>
                    Go
                  </div>
                </div>
              );
            }}
          </Query>
        </MoonProvider>
      </Provider>
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
    const store = createMoonStore({ queriesResult: { query4: cachedResponse } });
    const { container, getByText } = render(
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          <Query<QueryData, QueryVariables>
            id="query4"
            source="FOO"
            endPoint="/users"
            variables={{ foo: "bar" }}
            fetchOnMount={false}
            fetchPolicy={FetchPolicy.NetworkOnly}
          >
            {({ data, actions: { refetch } }) => {
              const users = data ? data.users : [];
              return (
                <div>
                  {users.map(user => {
                    return <span>{user.name}</span>;
                  })}
                  <div id="button" onClick={refetch}>
                    Go
                  </div>
                </div>
              );
            }}
          </Query>
        </MoonProvider>
      </Provider>
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
    const store = createMoonStore({ queriesResult: { query4: cachedResponse } });
    const { container, getByText } = render(
      <Provider store={store}>
        <MoonProvider links={links} store={store}>
          <Query<QueryData, QueryVariables>
            id="query4"
            source="FOO"
            endPoint="/users"
            variables={{ foo: "bar" }}
            fetchOnMount={false}
            fetchPolicy={FetchPolicy.NetworkOnly}
          >
            {({ data, actions: { refetch } }) => {
              const users = data ? data.users : [];
              return (
                <div>
                  {users.map(user => {
                    return <span>{user.name}</span>;
                  })}
                  <div id="button" onClick={refetch}>
                    Go
                  </div>
                </div>
              );
            }}
          </Query>
        </MoonProvider>
      </Provider>
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
