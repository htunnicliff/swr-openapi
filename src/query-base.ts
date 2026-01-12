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
        async (key) => {
          const [_, path, init] = key;
          // TypeScript cannot properly narrow the type of init when destructured from the key,
          // so we handle both cases explicitly: with init and without init
          const res =
            init !== undefined
              ? // oxlint-disable-next-line no-unsafe-type-assertion
                await client.GET(path, init as never)
              : // oxlint-disable-next-line no-unsafe-type-assertion
                await ((client.GET as any)(path) as ReturnType<
                  typeof client.GET<Path, never>
                >);
          if (res.error) {
            throw res.error;
          }
          // oxlint-disable-next-line no-unsafe-type-assertion
          return res.data as Data;
        },
        [client],
      );

      // Cast config to satisfy SWR's strict fetcher-aware configuration type
      // oxlint-disable-next-line no-unsafe-type-assertion
      return useHook<Data, Error, Key>(key, fetcher, config as never);
    };
  };
}
