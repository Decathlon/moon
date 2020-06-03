/* eslint-disable  import/no-extraneous-dependencies */
/// <reference path="./typings/tests-entry.d.ts" />

import * as React from "react";
import { createRenderer } from "react-test-renderer/shallow";

import { DumbMutation, IMutationChildrenProps } from "../src/mutation";

describe("Mutation component", () => {
  it("should call children with the mutation state", () => {
    const props = {
      actions: { mutate: jest.fn(), cancel: jest.fn() },
      loading: false,
      error: null,
      response: { foo: "bar" },
      children: (props: IMutationChildrenProps<{ foo: string }>) => <div>{JSON.stringify(props)}</div>
    };
    const shallowRenderer = createRenderer();
    //@ts-ignore 'DumbMutation' cannot be used as a JSX component.
    shallowRenderer.render(<DumbMutation {...props} />);
    const rendered = shallowRenderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});
