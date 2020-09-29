import * as React from "react";
import { render, waitFor } from "@testing-library/react";

import MoonProvider, { withMoon, IMoonContextValue } from "../../src/moon-provider";

import { links } from "../moon-client.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";

const MyComponent: React.FunctionComponent<IMoonContextValue> = ({ client }) => {
  const [response, setResponse] = React.useState<any>(null);
  React.useEffect(() => {
    //@ts-ignore can't be null
    client.query("FOO", "/users", { foo: "bar" }).then(result => {
      setResponse(result);
    });
  }, []);
  return <span>{!response ? "Loading" : "Success"}</span>;
};

const WithMoonComponent = withMoon(MyComponent);

describe("Custom component withMoon HOC", () => {
  test("should render the query response", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve({ status: true }));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseURL: string) {
        super(baseURL);
        this.get = get;
      }
    }
    mockAxiosClientConstructor(CustomAxiosClient);

    const { getByText } = render(
      <MoonProvider links={links}>
        <WithMoonComponent />
      </MoonProvider>
    );
    expect(getByText(/Loading/)).toBeTruthy();
    await waitFor(() => getByText(/Success/));
    expect(get).toHaveBeenCalledTimes(1);
  });
});
