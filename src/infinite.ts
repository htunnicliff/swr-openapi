import type { Client } from "openapi-fetch";
import type { MediaType, PathsWithMethod } from "openapi-typescript-helpers";
import { useCallback, useDebugValue } from "react";
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteFetcher,
  type SWRInfiniteKeyLoader,
} from "swr/infinite";
import type { Exact } from "type-fest";
import type { TypesForGetRequest } from "./types.js";

/**
 * Produces a typed wrapper for [`useSWRInfinite`](https://swr.vercel.app/docs/pagination#useswrinfinite).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 * const client = createClient();
 *
 * const useInfinite = createInfiniteHook(client, "<unique-key>");
 *
 * useInfinite("/pets", (index, previousPage) => {
 *   if (previousPage && !previousPage.hasMore) {
 *     return null;
 *   }
 *
 *   return {
 *     params: {
 *       query: {
 *         limit: 10,
 *         offset: index * 10,
 *       },
 *     },
 *   };
 * });
 * ```
 */
export function createInfiniteHook<
  Paths extends {},
  IMediaType extends MediaType,
  Prefix extends string,
  FetcherError = never,
>(client: Client<Paths, IMediaType>, prefix: Prefix) {
  return function useInfinite<
    Path extends PathsWithMethod<Paths, "get">,
    R extends TypesForGetRequest<Paths, Path>,
    Init extends Exact<R["Init"], Init>,
    Data extends R["Data"],
    Error extends R["Error"] | FetcherError,
    Config extends SWRInfiniteConfiguration<Data, Error>,
  >(
    path: Path,
    getInit: SWRInfiniteKeyLoader<Data, Init | null>,
    config?: Config,
  ) {
    type Key = [Prefix, Path, Init | undefined] | null;
    type KeyLoader = SWRInfiniteKeyLoader<Data, Key>;

    // oxlint-disable-next-line no-unsafe-type-assertion
    useDebugValue(`${prefix} - ${path as string}`);

    const fetcher: SWRInfiniteFetcher<Data, KeyLoader> = useCallback(
      async ([_, path, init]) => {
        // Type assertion needed: init from key destructuring has type Init | undefined,
        // but client.GET expects ...init: InitParam<MaybeOptionalInit<...>> as a rest parameter.
        // InitParam is a tuple type [(Init & { [key: string]: unknown })?] or [Init & { [key: string]: unknown }].
        // TypeScript cannot automatically convert our single value to the expected rest parameter tuple.
        // Runtime behavior is correct; this is a type system limitation.
        // oxlint-disable-next-line no-unsafe-type-assertion
        const res = await client.GET(path, init as any);
        if (res.error) {
          throw res.error;
        }
        // oxlint-disable-next-line no-unsafe-type-assertion
        return res.data as Data;
      },
      [client],
    );

    const getKey: KeyLoader = (index, previousPageData) => {
      const init = getInit(index, previousPageData);
      if (init === null) {
        return null;
      }
      const key: Key = [prefix, path, init];
      return key;
    };

    return useSWRInfinite<Data, Error, KeyLoader>(getKey, fetcher, config);
  };
}
