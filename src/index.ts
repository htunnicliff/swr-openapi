import type createClient from "openapi-fetch";
import type {
  FetchOptions,
  FetchResponse,
  ParseAsResponse,
} from "openapi-fetch";
import type {
  ErrorResponse,
  FilterKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";
import useSWR, { Fetcher, type SWRConfiguration } from "swr";
import { SWRInfiniteKeyLoader } from "swr/infinite";

export function makeHookFactory<Paths extends {}>(
  api: ReturnType<typeof createClient<Paths>>,
  keyPrefix: string,
) {
  // Define hook factory with typed paths
  return function hookFactory<
    Path extends PathsWithMethod<Paths, "get">,
    Req extends FilterKeys<Paths[Path], "get">,
  >(path: Path, swrConfigDefaults?: SWRConfiguration) {
    // Define hook that is returned for consumers with typed options
    // based on the given path
    function useHook<
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
        },
      );
    }

    useHook.getKey = (fetchOptions: FetchOptions<Req>) =>
      [keyPrefix, path, fetchOptions] as [
        typeof keyPrefix,
        Path,
        typeof fetchOptions,
      ];

    return useHook;
  };
}

export function makeSWRHelper<Paths extends {}>(
  api: ReturnType<typeof createClient<Paths>>,
  keyPrefix: string,
) {
  function swrHelper<
    Path extends PathsWithMethod<Paths, "get">,
    Req extends FilterKeys<Paths[Path], "get">,
    Options extends FetchOptions<Req>,
    Data extends NonNullable<FetchResponse<Req, Options>["data"]>,
    Key extends [string, Path, Options],
    OptionsInput extends
      | Options
      | ((index: number, previousPageData: Data | null) => Options | null),
  >(
    path: Path,
    optionsOrFn: OptionsInput,
  ): OptionsInput extends Options
    ? [Key, Fetcher<Data, Key>]
    : [SWRInfiniteKeyLoader<Data, Key>, Fetcher<Data, Key>] {
    const key =
      typeof optionsOrFn === "function"
        ? (index: number, previousPageData: Data | null) => {
            const options = optionsOrFn(index, previousPageData);
            if (options === null) {
              return null;
            }
            return [keyPrefix, path, options] as const;
          }
        : ([keyPrefix, path, optionsOrFn] as const);

    const fetcher = async ([, url, init]: Key) => {
      const { data, error } = await api.GET(url, init);
      if (error) {
        throw error;
      }
      return data!;
    };

    // @ts-expect-error - TODO: Come back to make the types sound
    return [key, fetcher] as const;
  }

  return swrHelper;
}
