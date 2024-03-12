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
import type { PartialDeep } from "type-fest";

let matchKeyComparator: ((a: object, b: object) => boolean) | undefined;

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

  function matchKey<
    Path extends PathsWithMethod<Paths, "get">,
    Req extends FilterKeys<Paths[Path], "get">,
    Options extends FetchOptions<Req>,
  >(path: Path, pathOptions?: PartialDeep<Options>) {
    return (key: unknown): boolean => {
      if (Array.isArray(key)) {
        const [prefix, keyPath, keyOptions] = key;
        return (
          // Matching prefix
          prefix === keyPrefix &&
          // Matching path
          keyPath === path &&
          // Matching options
          (pathOptions ? matchKeyComparator!(keyOptions, pathOptions) : true)
        );
      }

      return false;
    };
  }

  return {
    use,
    useInfinite,
    get matchKey() {
      if (!matchKeyComparator) {
        throw new Error(
          "Match key comparison is not enabled. Please call enableMatchKeyComparison with a comparator function.",
        );
      }

      return matchKey;
    },
  };
}

export function enableMatchKeyComparison(
  comparator: typeof matchKeyComparator,
) {
  matchKeyComparator = comparator;
}
