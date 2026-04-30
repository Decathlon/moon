import { waitFor } from "@testing-library/react";

/**
 * Replacement for `@testing-library/react-hooks`' `waitForNextUpdate`.
 * Polls until the predicate returns truthy (or doesn't throw).
 */
export async function waitForUpdate(predicate: () => unknown): Promise<void> {
  await waitFor(() => {
    const result = predicate();
    if (result === false || result === undefined || result === null) {
      throw new Error("waitForUpdate: predicate not ready");
    }
  });
}
