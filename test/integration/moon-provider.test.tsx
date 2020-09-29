import * as React from "react";
import { render, waitFor } from "@testing-library/react";

import MoonProvider, { withMoon, IMoonContextValue } from "../../src/moon-provider";
import { links } from "../moon-client.test";
import { createClientFactory, MockedClient, MockedClientConfig } from "../testUtils";

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
    class CustomClient extends MockedClient {
      constructor(config: MockedClientConfig) {
        super(config);
        this.get = get;
      }
    }
    const clientFactory = createClientFactory(CustomClient);

    const { getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <WithMoonComponent />
      </MoonProvider>
    );
    expect(getByText(/Loading/)).toBeTruthy();
    await waitFor(() => getByText(/Success/));
    expect(get).toHaveBeenCalledTimes(1);
  });
});
