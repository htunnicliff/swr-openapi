import useSWR from "swr";
import { describe, expect, it, vi } from "vitest";
import * as SuspenseBase from "../suspense-base.js";

vi.mock("../suspense-base.js");
const { configureBaseSuspenseQueryHook } = vi.mocked(SuspenseBase);
// @ts-expect-error - return type is not relevant to this test
configureBaseSuspenseQueryHook.mockReturnValue("pretend");

describe("createSuspenseQueryHook", () => {
  it("creates factory function using useSWR", async () => {
    const { createSuspenseQueryHook } = await import("../suspense.js");

    expect(configureBaseSuspenseQueryHook).toHaveBeenLastCalledWith(useSWR);
    expect(createSuspenseQueryHook).toBe("pretend");
  });
});
