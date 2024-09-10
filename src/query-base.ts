import type { Client } from "openapi-fetch";
import type {
  MediaType,
  PathsWithMethod,
  RequiredKeysOf,
} from "openapi-typescript-helpers";
import type { Fetcher, SWRHook } from "swr";
import type { TypesForGetRequest } from "./types.js";

/**
 * @private
 */
export function configureBaseQueryHook(useHook: SWRHook) {
  return function createQueryBaseHook<
    Paths extends {},
    IMediaType extends MediaType,
    Prefix extends string,
  >(client: Client<Paths, IMediaType>, prefix: Prefix) {
    return function useQuery<
      Path extends PathsWithMethod<Paths, "get">,
      R extends TypesForGetRequest<Paths, Path>,
      Init extends R["Init"],
      Data extends R["Data"],
      Error extends R["Error"],
      Config extends R["SWRConfig"],
    >(
      path: Path,
      ...[init, config]: RequiredKeysOf<Init> extends never
        ? [(Init | null)?, Config?]
        : [Init | null, Config?]
    ) {
      const key = init !== null ? ([prefix, path, init] as const) : null;

      type Key = typeof key;

      const fetcher: Fetcher<Data, Key> = async ([_, path, init]) => {
        // @ts-expect-error TODO: Improve internal init types
        const res = await client.GET(path, init);
        if (res.error) {
          throw res.error;
        }
        return res.data as Data;
      };

      // @ts-expect-error TODO: Improve internal config types
      return useHook<Data, Error, Key>(key, fetcher, config);
    };
  };
}
