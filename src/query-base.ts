import type { Client } from "openapi-fetch";
import type {
  MediaType,
  PathsWithMethod,
  RequiredKeysOf,
} from "openapi-typescript-helpers";
import { useCallback, useDebugValue, useMemo } from "react";
import type { Fetcher, SWRHook } from "swr";
import type { Exact } from "type-fest";
import type { TypesForGetRequest } from "./types.js";

/**
 * @private
 */
export function configureBaseQueryHook(useHook: SWRHook) {
  return function createQueryBaseHook<
    Paths extends {},
    IMediaType extends MediaType,
    Prefix extends string,
    FetcherError = never,
  >(client: Client<Paths, IMediaType>, prefix: Prefix) {
    return function useQuery<
      Path extends PathsWithMethod<Paths, "get">,
      R extends TypesForGetRequest<Paths, Path>,
      Init extends Exact<R["Init"], Init>,
      Data extends R["Data"],
      Error extends R["Error"] | FetcherError,
      Config extends R["SWRConfig"],
    >(
      path: Path,
      ...[init, config]: RequiredKeysOf<Init> extends never
        ? [(Init | null)?, Config?]
        : [Init | null, Config?]
    ) {
      // oxlint-disable-next-line no-unsafe-type-assertion
      useDebugValue(`${prefix} - ${path as string}`);

      const key = useMemo(
        () => (init !== null ? ([prefix, path, init] as const) : null),
        [prefix, path, init],
      );

      type Key = typeof key;

      // TODO: Lift up fetcher to and remove useCallback
      const fetcher: Fetcher<Data, Key> = useCallback(
        async ([_, path, init]) => {
          // Type assertion needed: init from key destructuring is Init | undefined,
          // but client.GET expects a rest parameter InitParam<MaybeOptionalInit<...>>
          // Runtime behavior is correct; this is a type system limitation
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

      // Type assertion needed: config type from generic parameter doesn't exactly
      // match the fetcher-aware SWRConfiguration type that useHook expects
      // oxlint-disable-next-line no-unsafe-type-assertion
      return useHook<Data, Error, Key>(key, fetcher, config as any);
    };
  };
}
