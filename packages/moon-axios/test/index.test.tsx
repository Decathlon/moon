import createAxiosClient from "../src";

describe("Utils", () => {
  it("should create an axios client", () => {
    const myClient = createAxiosClient({ baseURL: "https://my.url" });
    expect(myClient).toBeDefined();
    expect(myClient.instance.defaults.baseURL).toEqual("https://my.url");
  });
});
