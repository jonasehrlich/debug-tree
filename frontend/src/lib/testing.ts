/**
 * Expect that call of {@link fn} fails
 * @param reason - Reason why the call fails
 * @param fn - Function to wrap which should fail
 */
export const xfail = (reason: string, fn: () => void | Promise<void>) => {
  return async () => {
    try {
      await fn();
    } catch {
      return; // Expected failure
    }
    throw new Error(
      `Test unexpectedly passed. Remove XFail wrapper if '${reason}' is fixed`,
    );
  };
};
