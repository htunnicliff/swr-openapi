import createClient from "openapi-fetch";
import * as React from "react";
import * as SWRMutation from "swr/mutation";
import type { MutationFetcher } from "swr/mutation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMutationHook } from "../mutation.js";
import type { paths } from "./fixtures/petstore.js";

type AnyKey = readonly [string, string, string];
type AnyInit = Record<string, unknown>;
type AnyFetcher = MutationFetcher<unknown, AnyKey, AnyInit>;

// Mock `useCallback` and `useDebugValue`
vi.mock("react");
const { useCallback, useDebugValue } = vi.mocked(React);
useCallback.mockImplementation((fn) => fn);

// Mock `useSWRMutation`
vi.mock("swr/mutation");
const { default: useSWRMutation } = vi.mocked(SWRMutation);
useSWRMutation.mockReturnValue({
  trigger: vi.fn(),
  isMutating: false,
  data: undefined,
  error: undefined,
  reset: vi.fn(),
});

// Setup
const client = createClient<paths>();
const postSpy = vi.spyOn(client, "POST");
const putSpy = vi.spyOn(client, "PUT");
const deleteSpy = vi.spyOn(client, "DELETE");

describe("createMutationHook", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST mutations", () => {
    const useMutation = createMutationHook(client, "post", "<unique-key>");

    it("passes correct key to useSWRMutation", () => {
      useMutation("/pet");

      expect(useSWRMutation).toHaveBeenLastCalledWith(
        ["<unique-key>", "post", "/pet"],
        expect.any(Function),
        undefined,
      );
    });

    it("fetcher calls client.POST and returns data", async () => {
      postSpy.mockResolvedValueOnce({
        data: { id: 1, name: "doggie", photoUrls: [] },
        error: undefined,
        response: new Response(),
      });

      useMutation("/pet");

      const fetcher = useSWRMutation.mock.lastCall![1] as AnyFetcher;
      const init = { body: { name: "doggie", photoUrls: [] } };

      const result = await fetcher(["<unique-key>", "post", "/pet"] as const, {
        arg: init,
      });

      expect(postSpy).toHaveBeenLastCalledWith("/pet", init);
      expect(result).toEqual({ id: 1, name: "doggie", photoUrls: [] });
    });

    it("fetcher throws on error response", async () => {
      postSpy.mockResolvedValueOnce({
        data: undefined,
        error: { message: "Invalid input" },
        response: new Response(),
      });

      useMutation("/pet");

      const fetcher = useSWRMutation.mock.lastCall![1] as AnyFetcher;

      await expect(
        fetcher(["<unique-key>", "post", "/pet"] as const, { arg: {} }),
      ).rejects.toEqual({ message: "Invalid input" });
    });
  });

  describe("PUT mutations", () => {
    const useMutation = createMutationHook(client, "put", "<unique-key>");

    it("passes correct key with put method", () => {
      useMutation("/pet");

      expect(useSWRMutation).toHaveBeenLastCalledWith(
        ["<unique-key>", "put", "/pet"],
        expect.any(Function),
        undefined,
      );
    });

    it("fetcher calls client.PUT", async () => {
      putSpy.mockResolvedValueOnce({
        data: { id: 1, name: "updated", photoUrls: [] },
        error: undefined,
        response: new Response(),
      });

      useMutation("/pet");

      const fetcher = useSWRMutation.mock.lastCall![1] as AnyFetcher;
      const init = { body: { id: 1, name: "updated", photoUrls: [] } };

      await fetcher(["<unique-key>", "put", "/pet"] as const, { arg: init });

      expect(putSpy).toHaveBeenLastCalledWith("/pet", init);
    });
  });

  describe("DELETE mutations", () => {
    const useMutation = createMutationHook(client, "delete", "<unique-key>");

    it("passes correct key with delete method", () => {
      useMutation("/pet/{petId}");

      expect(useSWRMutation).toHaveBeenLastCalledWith(
        ["<unique-key>", "delete", "/pet/{petId}"],
        expect.any(Function),
        undefined,
      );
    });

    it("fetcher calls client.DELETE with path params", async () => {
      deleteSpy.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(),
      });

      useMutation("/pet/{petId}");

      const fetcher = useSWRMutation.mock.lastCall![1] as AnyFetcher;
      const init = { params: { path: { petId: 123 } } };

      await fetcher(["<unique-key>", "delete", "/pet/{petId}"] as const, { arg: init });

      expect(deleteSpy).toHaveBeenLastCalledWith("/pet/{petId}", init);
    });
  });

  it("invokes debug value hook", () => {
    const useMutation = createMutationHook(client, "post", "<unique-key>");
    useMutation("/pet");

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key> - post /pet");
  });

  it("passes config to useSWRMutation", () => {
    const useMutation = createMutationHook(client, "post", "<unique-key>");
    // @ts-expect-error - Testing config passthrough
    useMutation("/pet", { throwOnError: false });

    expect(useSWRMutation).toHaveBeenLastCalledWith(
      ["<unique-key>", "post", "/pet"],
      expect.any(Function),
      { throwOnError: false },
    );
  });
});
