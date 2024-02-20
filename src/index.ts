import type createClient from "openapi-fetch";
import type { FetchOptions, ParseAsResponse } from "openapi-fetch";
import type {
  ErrorResponse,
  FilterKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";
import useSWR, { type SWRConfiguration } from "swr";

export function makeHookFactory<Paths extends {}>(
  api: ReturnType<typeof createClient<Paths>>,
  keyPrefix: string
) {
  // Define hook factory with typed paths
  return function hookFactory<Path extends PathsWithMethod<Paths, "get">>(
    path: Path,
    swrConfigDefaults?: SWRConfiguration
  ) {
    // Define hook that is returned for consumers with typed options
    // based on the given path
    function useHook<
      Req extends FilterKeys<Paths[Path], "get">,
      Options extends FetchOptions<Req>,
      Data extends ParseAsResponse<
        FilterKeys<SuccessResponse<ResponseObjectMap<Req>>, MediaType>,
        Options
      >,
      Error extends FilterKeys<
        ErrorResponse<ResponseObjectMap<Req>>,
        MediaType
      >,
      Config extends SWRConfiguration<Data, Error>,
    >(fetchOptions: Options | null, swrConfig?: Config) {
      type Key = [typeof keyPrefix, Path, Options] | null;

      return useSWR<Data, Error, Key, Config>(
        // SWR key is based on the path and fetch options
        // keyPrefix keeps each API's cache separate in case there are path collisions
        fetchOptions ? [keyPrefix, path, fetchOptions] : null,
        // Fetcher function
        // @ts-expect-error - This functions correctly, but we don't need to fix its types
        // types since we rely on the generics passed to useSWR instead
        async ([_, url, options]) => {
          const res = await api.GET(url, options);
          if (res.error) {
            throw res.error;
          }
          return res.data;
        },
        // SWR config
        {
          ...swrConfigDefaults,
          ...swrConfig,
        }
      );
    }

    return useHook;
  };
}
