/* eslint-disable  import/no-extraneous-dependencies */
/// <reference path="./typings/tests-entry.d.ts" />

import * as React from "react";
import { createRenderer } from "react-test-renderer/shallow";

import { DumbQuery, IQueryChildrenProps } from "../src/query";
import { MoonNetworkStatus } from "../src/store";

describe("Query component", () => {
  it("should call children with the query state", () => {
    const props = {
      actions: { refetch: jest.fn(), cancel: jest.fn() },
      loading: false,
      error: null,
      data: { foo: "bar" },
      networkStatus: MoonNetworkStatus.Finished,
      children: (props: IQueryChildrenProps<{ foo: string }>) => <div>{JSON.stringify(props)}</div>
    };
    const shallowRenderer = createRenderer();
    // @ts-ignore 'DumbQuery' cannot be used as a JSX component !!
    shallowRenderer.render(<DumbQuery {...props} />);
    const rendered = shallowRenderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});
