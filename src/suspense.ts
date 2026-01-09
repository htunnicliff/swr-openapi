import useSWR from "swr";
import { configureBaseSuspenseQueryHook } from "./suspense-base.js";

/**
 * Produces a typed wrapper for [`useSWR`](https://swr.vercel.app/docs/api) with suspense enabled.
 *
 * The returned hook always has `data` defined (non-optional) since suspense
 * guarantees data is available before the component renders.
 *
 * ```ts
 * import createClient from "openapi-fetch";
 *
 * const client = createClient();
 *
 * const useSuspenseQuery = createSuspenseQueryHook(client, "<unique-key>");
 *
 * // Fetch the query (data is always defined)
 * const { data } = useSuspenseQuery("/pets");
 *
 * // Fetch the query with parameters
 * const { data } = useSuspenseQuery("/pets", {
 *   params: { query: { limit: 10 } }
 * });
 * ```
 */
export const createSuspenseQueryHook = configureBaseSuspenseQueryHook(useSWR);
