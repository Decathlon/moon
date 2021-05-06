import createGraphQLClient from "../src";

describe("Utils", () => {
  it("should create an graphql client", () => {
    const myClient = createGraphQLClient({ baseURL: "https://my.url" });
    expect(myClient).toBeDefined();
  });
});
