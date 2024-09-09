import createClient from "openapi-fetch";
import * as React from "react";
import * as SWR from "swr";
import type { ScopedMutator } from "swr/_internal";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMutate } from "../mutate.js";
import type { paths } from "./fixtures/petstore.js";

// Mock `useCallback` (return given function as-is)
vi.mock("react");
const { useCallback } = vi.mocked(React);
useCallback.mockImplementation((fn, _deps) => fn);

// Mock `useSWRConfig`
const swrMutate = vi.fn<ScopedMutator>();
vi.mock("swr");
const { useSWRConfig } = vi.mocked(SWR);
// @ts-expect-error - only `mutate` is relevant to this test
useSWRConfig.mockReturnValue({ mutate: swrMutate });

// Setup
const client = createClient<paths>();
const getKeyMatcher = () => {
  if (swrMutate.mock.calls.length === 0) {
    throw new Error("swr `mutate` not called");
  }
  return swrMutate.mock.lastCall![0] as ScopedMutator;
};

describe("useMutate", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns callback that invokes swr `mutate` with fn, data and options", async () => {
    const mutate = useMutate(
      client,
      "<unique-key>",
      // @ts-expect-error - not going to compare for this test
      null,
    );

    expect(swrMutate).not.toHaveBeenCalled();

    const data = {
      name: "doggie",
      photoUrls: ["https://example.com"],
    };
    const config = { throwOnError: false };

    await mutate(["/pet/findByStatus"], data, config);

    expect(swrMutate).toHaveBeenCalledTimes(1);
    expect(swrMutate).toHaveBeenLastCalledWith(
      // Matcher function
      expect.any(Function),
      // Data
      data,
      // Config
      config,
    );
  });

  describe("useMutate -> mutate -> key matcher", () => {
    it("returns false for non-array keys", () => {
      const mutate = useMutate(
        client,
        "<unique-key>",
        // @ts-expect-error - not going to compare for this test
        null,
      );

      mutate(["/pet/findByTags"]);
      const keyMatcher = getKeyMatcher();

      expect(keyMatcher(null)).toBe(false);
      expect(keyMatcher(undefined)).toBe(false);
      expect(keyMatcher("")).toBe(false);
      expect(keyMatcher({})).toBe(false);
    });

    it("returns false for arrays with length !== 3", () => {
      const mutate = useMutate(
        client,
        "<unique-key>",
        // @ts-expect-error - not going to compare for this test
        null,
      );

      mutate(["/pet/findByTags"]);
      const keyMatcher = getKeyMatcher();

      expect(keyMatcher(Array(0))).toBe(false);
      expect(keyMatcher(Array(1))).toBe(false);
      expect(keyMatcher(Array(2))).toBe(false);
      expect(keyMatcher(Array(4))).toBe(false);
      expect(keyMatcher(Array(5))).toBe(false);
    });

    it("matches when prefix and path are equal and init isn't given", () => {
      const mutate = useMutate(
        client,
        "<unique-key>",
        // @ts-expect-error - not going to compare for this test
        null,
      );

      mutate(["/pet/findByTags"]);
      const keyMatcher = getKeyMatcher();

      // Same path, no init
      expect(keyMatcher(["<unique-key>", "/pet/findByTags"])).toBe(true);

      // Same path, init ignored
      expect(
        keyMatcher(["<unique-key>", "/pet/findByTags", { some: "init" }]),
      ).toBe(true);

      // Same path, undefined init ignored
      expect(keyMatcher(["<unique-key>", "/pet/findByTags", undefined])).toBe(
        true,
      );
    });

    it("returns compare result when prefix and path are equal and init is given", () => {
      const psudeoCompare = vi.fn().mockReturnValue("booleanPlaceholder");

      const prefix = "<unique-key>";
      const path = "/pet/findByTags";
      const givenInit = {};

      const mutate = useMutate(client, prefix, psudeoCompare);
      mutate([path, givenInit]);
      const keyMatcher = getKeyMatcher();

      const result = keyMatcher([
        prefix, // Same prefix -> true
        path, // Same path -> true
        { some: "init" }, // Init -> should call `compare`
      ]);

      expect(psudeoCompare).toHaveBeenLastCalledWith(
        { some: "init" }, // Init from key
        givenInit, // Init given to compare
      );

      // Note: compare result is returned (real world would be boolean)
      expect(result).toBe("booleanPlaceholder");
    });
  });
});
