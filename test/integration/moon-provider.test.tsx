import * as React from "react";
import { render, wait } from "@testing-library/react";

import MoonProvider, { withMoon, IMoonContextValue } from "../../src/moon-provider";

import { links } from "../moon-client.test";
import { mockAxiosClientConstructor, AxiosClient } from "../testUtils";

const MyComponent: React.FunctionComponent<IMoonContextValue> = ({ client }) => {
  const [response, setRespons] = React.useState<any>(null);
  React.useEffect(() => {
    //@ts-ignore can't be null
    client.query("FOO", "/users", { foo: "bar" }).then(result => {
      setRespons(result);
    });
  }, []);
  return <span>{!response ? "Loading" : "Success"}</span>;
};

const WithMoonComponent = withMoon(MyComponent);

describe("Custom component withMoon HOC", () => {
  test("should render the query response", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve({ status: true }));
    class CustomAxiosClient extends AxiosClient {
      constructor(baseUrl: string) {
        super(baseUrl);
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
    await wait(() => getByText(/Success/));
    expect(get).toHaveBeenCalledTimes(1);
  });
});
