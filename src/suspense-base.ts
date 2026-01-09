import type { Client } from "openapi-fetch";
import type { MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";
import { useCallback, useDebugValue, useMemo } from "react";
import type { Fetcher, SWRHook } from "swr";
import type { Exact } from "type-fest";
import type { SuspenseSWRConfig, SuspenseSWRResponse, TypesForGetRequest } from "./types.js";

/**
 * @private
 */
export function configureBaseSuspenseQueryHook(useHook: SWRHook) {
  return function createSuspenseQueryBaseHook<
    Paths extends {},
    IMediaType extends MediaType,
    Prefix extends string,
    FetcherError = never,
  >(client: Client<Paths, IMediaType>, prefix: Prefix) {
    return function useSuspenseQuery<
      Path extends PathsWithMethod<Paths, "get">,
      R extends TypesForGetRequest<Paths, Path>,
      Init extends Exact<R["Init"], Init>,
      Data extends R["Data"],
      Error extends R["Error"] | FetcherError,
    >(
      path: Path,
      ...[init, config]: RequiredKeysOf<Init> extends never
        ? [(Init | null)?, SuspenseSWRConfig<Data, Error>?]
        : [Init | null, SuspenseSWRConfig<Data, Error>?]
    ): SuspenseSWRResponse<Data, Error> {
      useDebugValue(`${prefix} - ${path as string}`);

      const key = useMemo(() => (init !== null ? ([prefix, path, init] as const) : null), [prefix, path, init]);

      type Key = typeof key;

      const fetcher: Fetcher<Data, Key> = useCallback(
        async ([_, path, init]) => {
          // @ts-expect-error TODO: Improve internal init types
          const res = await client.GET(path, init);
          if (res.error) {
            throw res.error;
          }
          return res.data as Data;
        },
        [client],
      );

      // @ts-expect-error TODO: Improve internal config types
      return useHook<Data, Error, Key>(key, fetcher, { ...config, suspense: true });
    };
  };
}
