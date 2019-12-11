/* eslint-disable  prefer-destructuring */
/// <reference path="./typings/tests-entry.d.ts" />
import { renderHook } from "@testing-library/react-hooks";

import { createHttpClient, getClients, usePrevValue } from "../src/utils";

const links = [
  { id: "FOO", baseUrl: "http://foo.com", interceptors: {} },
  { id: "BAR", baseUrl: "http://bar.com", interceptors: {} }
];

describe("Utils", () => {
  it("should create an axios client", () => {
    const myClient = createHttpClient("https://my.url");
    expect(myClient).toBeDefined();
    expect(myClient.defaults.baseURL).toEqual("https://my.url");
  });

  it("should create BAR and FOO sources", () => {
    const clients = getClients(links);
    const clientsIds = Object.keys(clients);
    expect(clientsIds).toEqual(["FOO", "BAR"]);
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
