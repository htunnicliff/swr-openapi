import useSWRImmutable from "swr/immutable";
import { configureBaseQueryHook } from "./query-base";

/**
 * ```ts
 * const client = createClient();
 *
 * const useImmutable = createImmutableHook(client, "<unique-key>");
 *
 * // Fetch the query
 * useImmutable("/pets");
 *
 * // Skip the query
 * useImmutable("/pets", null);
 *
 * // Fetch the query with parameters
 * useImmutable("/pets", {
 *   params: { query: { limit: 10 } }
 * });
 *
 * // Fetch the query with parameters and SWR configuration
 * useImmutable(
 *   "/pets",
 *   { params: { query: { limit: 10 } } },
 *   { errorRetryCount: 2 },
 * );
 *
 * // Fetch the query with no parameters and SWR configuration
 * useImmutable(
 *   "/pets",
 *   {},
 *   { errorRetryCount: 2 },
 * );
 * ```
 */
export const createImmutableHook = configureBaseQueryHook(useSWRImmutable);
