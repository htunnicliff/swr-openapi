import type { FetchOptions } from "openapi-fetch";
import type createClient from "openapi-fetch";
import type { FilterKeys, PathsWithMethod } from "openapi-typescript-helpers";
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
      Options extends FetchOptions<FilterKeys<Paths[Path], "get">>,
      Response extends Awaited<ReturnType<typeof api.GET<Path>>>
    >(
      fetchOptions: Options | null | undefined,
      swrConfig?: SWRConfiguration<Response["data"], Response["error"]>
    ) {
      type Key = [typeof keyPrefix, Path, Options] | null;

      return useSWR<Response["data"], Response["error"], Key>(
        // SWR key is based on the path and fetch options
        // keyPrefix keeps each API's cache separate in case there are path collisions
        fetchOptions ? [keyPrefix, path, fetchOptions] : null,
        // Fetcher function
        async ([_, url, options]) => {
          const { data, error } = await api.GET(url, options);
          if (error) {
            throw error;
          }
          return data;
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
