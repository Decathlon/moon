import * as React from "react";
import { render, waitFor } from "@testing-library/react";

import MoonProvider, { withMoon, IMoonContextValue } from "../../src/moonProvider";
import { links } from "../moon-client.test";
import { getMockedClientFactory } from "../testUtils";

interface IProps extends IMoonContextValue {
  prop: string;
}

const MyComponent: React.FunctionComponent<IProps> = ({ client }) => {
  const [response, setResponse] = React.useState<any>(null);
  React.useEffect(() => {
    //@ts-ignore can't be null
    client.query("FOO", "/users", { foo: "bar" }).then(result => {
      setResponse(result);
    });
  }, []);
  return <span>{!response ? "Loading" : "Success"}</span>;
};

const WithMoonComponent = withMoon<IProps>(MyComponent);

describe("Custom component withMoon HOC", () => {
  test("should render the query response", async () => {
    const get = jest.fn().mockImplementation(() => Promise.resolve({ status: true }));
    const clientFactory = getMockedClientFactory({ get });

    const { getByText } = render(
      <MoonProvider links={links} clientFactory={clientFactory}>
        <WithMoonComponent prop="test" />
      </MoonProvider>
    );
    expect(getByText(/Loading/)).toBeTruthy();
    await waitFor(() => getByText(/Success/));
    expect(get).toHaveBeenCalledTimes(1);
  });
});
