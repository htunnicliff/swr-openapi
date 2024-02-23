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
import useSWRInfinite, { SWRInfiniteKeyLoader } from "swr/infinite";

export function createHooks<Paths extends {}>(
  api: ReturnType<typeof createClient<Paths>>,
  keyPrefix: string,
) {
  function use<
    Path extends PathsWithMethod<Paths, "get">,
    Req extends FilterKeys<Paths[Path], "get">,
    Options extends FetchOptions<Req>,
    Data extends ParseAsResponse<
      FilterKeys<SuccessResponse<ResponseObjectMap<Req>>, MediaType>,
      Options
    >,
    Error extends FilterKeys<ErrorResponse<ResponseObjectMap<Req>>, MediaType>,
    Config extends SWRConfiguration<Data, Error>,
  >(path: Path, options: Options | null, swrConfig?: Config) {
    type Key = [typeof keyPrefix, Path, Options] | null;

    return useSWR<Data, Error, Key, Config>(
      // SWR key is based on the path and fetch options
      // keyPrefix keeps each API's cache separate in case there are path collisions
      options ? [keyPrefix, path, options] : null,
      // Fetcher function
      // @ts-expect-error - This functions correctly, but we don't need to fix its types
      // types since we rely on the generics passed to useSWR instead
      async ([_, url, init]) => {
        const res = await api.GET(url, init);
        if (res.error) {
          throw res.error;
        }
        return res.data;
      },
      // SWR config
      swrConfig,
    );
  }

  function useInfinite<
    Path extends PathsWithMethod<Paths, "get">,
    Req extends FilterKeys<Paths[Path], "get">,
    Options extends FetchOptions<Req>,
    Data extends ParseAsResponse<
      FilterKeys<SuccessResponse<ResponseObjectMap<Req>>, MediaType>,
      Options
    >,
    Error extends FilterKeys<ErrorResponse<ResponseObjectMap<Req>>, MediaType>,
    Config extends SWRConfiguration<Data, Error>,
  >(
    path: Path,
    getOptionsFn: SWRInfiniteKeyLoader<Data, Options | null>,
    swrConfig?: Config,
  ) {
    type Key = [typeof keyPrefix, Path, Options] | null;

    return useSWRInfinite<Data, Error, SWRInfiniteKeyLoader<Data, Key>>(
      // SWR key is based on the path and fetch options
      // keyPrefix keeps each API's cache separate in case there are path collisions
      (index, previousPageData) => {
        const options = getOptionsFn(index, previousPageData);
        if (options === null) {
          return null;
        }
        return [keyPrefix, path, options] as const;
      },
      // Fetcher function
      // @ts-expect-error - This functions correctly, but we don't need to fix its types
      // types since we rely on the generics passed to useSWR instead
      async ([_, url, init]) => {
        const res = await api.GET(url, init);
        if (res.error) {
          throw res.error;
        }
        return res.data;
      },
      // SWR config
      swrConfig,
    );
  }

  return {
    use,
    useInfinite,
  };
}
