import createClient from "openapi-fetch";
import * as SWR from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { paths } from "./fixtures/petstore";
import { configureBaseQueryHook } from "../query-base";

// Mock `useSWR`
vi.mock("swr");
const { default: useSWR } = vi.mocked(SWR);
useSWR.mockReturnValue({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
});

// Mock `client.GET`
const client = createClient<paths>();
const getSpy = vi.spyOn(client, "GET");
getSpy.mockResolvedValue({ data: undefined, error: undefined });
// Create testable useQuery hook
const createQueryHook = configureBaseQueryHook(useSWR);
const useQuery = createQueryHook(client, "<unique-key>");

describe("configureBaseQueryHook", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes correct key to useSWR", () => {
    useQuery("/store/inventory", {});
    expect(useSWR).toHaveBeenLastCalledWith(
      ["<unique-key>", "/store/inventory", {}],
      expect.any(Function),
    );

    useQuery("/pet/findByTags", {
      params: {
        query: {
          tags: ["tag1", "tag2"],
        },
      },
    });
    expect(useSWR).toHaveBeenLastCalledWith(
      [
        "<unique-key>",
        "/pet/findByTags",
        {
          params: {
            query: {
              tags: ["tag1", "tag2"],
            },
          },
        },
      ],
      expect.any(Function),
    );

    // @ts-expect-error - TODO: Support undefined init when not required
    useQuery("/store/inventory");
    expect(useSWR).toHaveBeenLastCalledWith(
      ["<unique-key>", "/store/inventory", undefined],
      expect.any(Function),
    );
  });

  it("passes correct fetcher to useSWR", async () => {
    // Note: useQuery input doesn't matter here, since we test the fetcher in isolation
    useQuery("/pet/findByTags", {});

    const fetcher = useSWR.mock.lastCall![1];

    // client.GET not called until fetcher is called
    expect(getSpy).not.toHaveBeenCalled();

    // Call fetcher
    getSpy.mockResolvedValueOnce({ data: "some-data", error: undefined });
    const data = await fetcher!(["some-key", "any-path", { some: "init" }]);

    expect(getSpy).toHaveBeenLastCalledWith("any-path", { some: "init" });
    expect(data).toBe("some-data");

    // Call fetcher with error
    getSpy.mockResolvedValueOnce({
      data: undefined,
      error: new Error("Yikes"),
    });

    await expect(() =>
      fetcher!(["some-key", "any-path", { some: "init" }]),
    ).rejects.toThrowError(new Error("Yikes"));
  });

  it("passes correct config to useSWR", () => {
    useQuery("/pet/findByTags", {}, { errorRetryCount: 56 });

    expect(useSWR).toHaveBeenLastCalledWith(
      ["<unique-key>", "/pet/findByTags", {}],
      expect.any(Function),
      { errorRetryCount: 56 },
    );
  });
});
