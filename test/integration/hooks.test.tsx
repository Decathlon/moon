/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render } from "@testing-library/react";

import { usePrevValue, useQueryResult, useQueriesResults, useQueryState, useQueriesStates } from "../../src/hooks";
import { AxiosClient, mockAxiosClientConstructor } from "../testUtils";
import MoonProvider from "../../src/moon-provider";
import useQuery from "../../src/query-hook";
import { links } from "../moon-client.test";
import { QueryState } from "../../src/store";
import { withQueryResult, withQueriesResults } from "../../src/query";

interface QueryData {
  users: { id: number; name: string }[];
}

interface QueryVariables {
  foo: string;
}

const response = {
  users: [{ id: 1, name: "John Smith" }]
};

interface Props {
  queryId: QueryState;
}

const MyComponent: React.FunctionComponent<Props> = ({ queryId }) => {
  return <span>{!queryId ? "Loading" : "Success"}</span>;
};

const WithQueryResultComponent = withQueryResult<Props, Omit<Props, "queryId">, QueryData>("queryId")(MyComponent);

const WithQueriesResultsComponent = withQueriesResults<Props, Omit<Props, "queryId">, QueryData>(["queryId"])(MyComponent);

describe("Hooks", () => {
  test("should render the query result with withQueryResult HOC", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "queryId", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    const { getByText } = render(<WithQueryResultComponent />, { wrapper });
    expect(getByText(/Success/)).toBeTruthy();
  });

  test("should render the query result with withQueriesResults HOC", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "queryId", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    const { getByText } = render(<WithQueriesResultsComponent />, { wrapper });
    expect(getByText(/Success/)).toBeTruthy();
  });

  test("should render the query result with useQueryResult", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "myQuery", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    //@ts-ignore response can't be undefined
    const { result } = renderHook(() => useQueryResult<QueryData, number>("myQuery", response => response.users[0].id), {
      wrapper
    });
    expect(result.current).toEqual(response.users[0].id);
  });

  test("should render the query result with useQueriesResults ", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "myQuery1", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    const { result } = renderHook(
      () => useQueriesResults<QueryData, { myQuery1: QueryState }>(["myQuery1"]),
      { wrapper }
    );
    expect(result.current.myQuery1).toEqual(response);
  });

  test("should render the query result with useQueryState", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "myQuery2", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    //@ts-ignore data can't be undefined
    const { result } = renderHook(() => useQueryState<QueryData, number>("myQuery2", response => response.data.users[0].id), {
      wrapper
    });
    expect(result.current).toEqual(response.users[0].id);
  });

  test("should render the query result with useQueriesStates ", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(response));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
        this.get = get;
      }
    }

    mockAxiosClientConstructor(CustomAxiosClient);

    const wrapper = ({ children }: { children?: any }) => <MoonProvider links={links}>{children}</MoonProvider>;
    const variables = { foo: "bar" };
    const { waitForNextUpdate } = renderHook(
      () => useQuery<QueryData, QueryVariables>({ id: "myQuery3", source: "FOO", endPoint: "/users", variables }),
      { wrapper }
    );
    await waitForNextUpdate();
    const { result } = renderHook(
      () => useQueriesStates<QueryData, { myQuery3: QueryState }>(["myQuery3"]),
      { wrapper }
    );
    //@ts-ignore myQuery3 can't be undefined
    expect(result.current.myQuery3.data).toEqual(response);
  });

  test("should usePrevValue hook return prev props", async () => {
    const query = { source: "FOO", endPoint: "/users" };
    const { result, rerender } = renderHook(props => usePrevValue(props || query));

    rerender({ source: "FOO", endPoint: "/users" });
    const { value, prevValue } = result.current;
    expect(value === query).toBeTruthy();
    expect(prevValue === query).toBeTruthy();
    rerender({ source: "BAR", endPoint: "/users" });
    const { value: newValue, prevValue: newPrevProps } = result.current;
    expect(value).toEqual(newPrevProps);
    expect(newValue).not.toEqual(value);
  });
});
