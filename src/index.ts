import type { FetchOptions } from "openapi-fetch";
import type createClient from "openapi-fetch";
import type { FilterKeys, PathsWithMethod } from "openapi-typescript-helpers";
import useSWR, { type SWRConfiguration } from "swr";

export function makeHookFactory<Paths extends {}>(
  api: ReturnType<typeof createClient<Paths>>
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
      fetchOptions: Options,
      swrConfig?: SWRConfiguration<Response["data"], Response["error"]>
    ) {
      type Key = [Path, Options];

      return useSWR<Response["data"], Response["error"], Key>(
        // SWR key is based on the path and fetch options
        [path, fetchOptions],
        // Fetcher function
        async ([url, options]) => {
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
