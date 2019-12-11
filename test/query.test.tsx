/* eslint-disable  import/no-extraneous-dependencies */
/// <reference path="./typings/tests-entry.d.ts" />

import * as React from "react";
import { createRenderer } from "react-test-renderer/shallow";

import { DumbQuery, IQueryChildrenProps } from "../src/query";

describe("Query component", () => {
  it("should call children with the query state", () => {
    const props = {
      actions: { refatch: jest.fn(), cancel: jest.fn() },
      loading: false,
      error: null,
      data: { foo: "bar" },
      children: (props: IQueryChildrenProps<{ foo: string }>) => <div>{JSON.stringify(props)}</div>
    };
    const shallowRenderer = createRenderer();
    shallowRenderer.render(<DumbQuery {...props} />);
    const rendered = shallowRenderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});
