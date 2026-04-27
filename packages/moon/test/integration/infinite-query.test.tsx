/* eslint-disable max-classes-per-file */
/* eslint-disable  prefer-destructuring */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { renderHook, act, waitFor, render } from "@testing-library/react";

import MoonProvider from "../../src/moonProvider";
import useInfiniteQuery from "../../src/useInfiniteQuery";
import InfiniteQuery from "../../src/infiniteQuery";
import { links } from "../moon-client.test";
import { getMockedClientFactory, MockedClientConfig } from "../testUtils";

interface QueryVariables {
  user: string;
}

interface PageVariables {
  cursor?: string | null;
}

interface PageResponse {
  comments: { id: number; text: string }[];
  nextId: string | null;
}

const pageOne: PageResponse = { comments: [{ id: 1, text: "hello" }], nextId: "p2" };
const pageTwo: PageResponse = { comments: [{ id: 2, text: "world" }], nextId: null };

describe("useInfiniteQuery hook", () => {
  test("should fetch the first page", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(pageOne));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useInfiniteQuery<QueryVariables, PageVariables, PageResponse, PageResponse, any, MockedClientConfig>({
          id: "infinite-1",
          source: "FOO",
          endPoint: "/comments",
          variables: { user: "bar" },
          queryConfig: {
            getNextPageParam: lastPage => (lastPage.nextId ? { cursor: lastPage.nextId } : undefined)
          }
        }),
      { wrapper }
    );

    let state = result.current[0];
    expect(state.isLoading).toBeTruthy();
    expect(state.data).toBeUndefined();

    await waitFor(() => expect(result.current[0].data).toBeDefined());
    state = result.current[0];
    expect(state.isLoading).toBeFalsy();
    expect(state.data?.pages).toHaveLength(1);
    expect(state.data?.pages[0]).toEqual(pageOne);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/comments", expect.objectContaining({ params: { user: "bar" } }));
  });

  test("should fetch next page using getNextPageParam", async () => {
    const get = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(pageOne))
      .mockImplementationOnce(() => Promise.resolve(pageTwo));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useInfiniteQuery<QueryVariables, PageVariables, PageResponse, PageResponse, any, MockedClientConfig>({
          id: "infinite-2",
          source: "FOO",
          endPoint: "/comments",
          variables: { user: "bar" },
          queryConfig: {
            getNextPageParam: lastPage => (lastPage.nextId ? { cursor: lastPage.nextId } : undefined)
          }
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current[0].data?.pages).toHaveLength(1));

    await act(async () => {
      await result.current[1].fetchNextPage();
    });
    await waitFor(() => expect(result.current[0].data?.pages).toHaveLength(2));

    const pages = result.current[0].data?.pages || [];
    expect(pages[1]).toEqual(pageTwo);
    expect(get).toHaveBeenCalledTimes(2);
    // second call merges variables and the cursor returned by getNextPageParam
    expect(get).toHaveBeenLastCalledWith("/comments", expect.objectContaining({ params: { user: "bar", cursor: "p2" } }));
  });

  test("InfiniteQuery component renders pages", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(pageOne));
    const clientFactory = getMockedClientFactory({ get });

    const { container, getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <InfiniteQuery<QueryVariables, PageVariables, PageResponse, PageResponse, any, MockedClientConfig>
          id="infinite-3"
          source="FOO"
          endPoint="/comments"
          variables={{ user: "bar" }}
          queryConfig={{
            getNextPageParam: lastPage => (lastPage.nextId ? { cursor: lastPage.nextId } : undefined)
          }}
        >
          {({ data, isLoading, actions }) => {
            if (isLoading || !data) return <span>Loading</span>;
            return (
              <div>
                {data.pages.map((page, idx) => (
                  <span key={idx}>{page.comments[0].text}</span>
                ))}
                <button type="button" id="more" onClick={() => actions.fetchNextPage()}>
                  more
                </button>
              </div>
            );
          }}
        </InfiniteQuery>
      </MoonProvider>
    );

    expect(getByText(/Loading/)).toBeTruthy();
    await waitFor(() => expect(container.querySelector("#more")).toBeTruthy());
    expect(getByText(/hello/)).toBeTruthy();
  });

  test("refetch when variables change", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(pageOne));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { rerender } = renderHook(
      ({ user }) =>
        useInfiniteQuery<QueryVariables, PageVariables, PageResponse, PageResponse, any, MockedClientConfig>({
          source: "FOO",
          endPoint: "/comments",
          variables: { user },
          queryConfig: {
            getNextPageParam: lastPage => (lastPage.nextId ? { cursor: lastPage.nextId } : undefined)
          }
        }),
      { wrapper, initialProps: { user: "bar" } }
    );
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    rerender({ user: "baz" });
    // queryId changes (variables are part of the auto-generated id) so react-query refetches
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenLastCalledWith("/comments", expect.objectContaining({ params: { user: "baz" } }));
  });

  test("cancel does not throw", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve(pageOne));
    const clientFactory = getMockedClientFactory({ get });

    const wrapper = ({ children }: { children?: any }) => (
      <MoonProvider links={links} clientFactory={clientFactory}>
        {children}
      </MoonProvider>
    );

    const { result } = renderHook(
      () =>
        useInfiniteQuery<QueryVariables, PageVariables, PageResponse, PageResponse, any, MockedClientConfig>({
          id: "infinite-5",
          source: "FOO",
          endPoint: "/comments",
          variables: { user: "bar" },
          queryConfig: {
            getNextPageParam: lastPage => (lastPage.nextId ? { cursor: lastPage.nextId } : undefined)
          }
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current[0].data?.pages).toHaveLength(1));
    expect(() => result.current[1].cancel()).not.toThrow();
  });
});
