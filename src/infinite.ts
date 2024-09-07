import type { Client, FetchOptions, ParseAsResponse } from "openapi-fetch";
import type {
  ErrorResponse,
  FilterKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteFetcher,
  type SWRInfiniteKeyLoader,
} from "swr/infinite";

/**
 * ```ts
 * const client = createClient();
 *
 * const useInfinite = createInfiniteHook(client, "<unique-key>");
 *
 * useInfinite("/pets", (index, previousPage) => {
 *   if (previousPage && !previousPage.hasMore) {
 *     return null;
 *   }
 *
 *   return {
 *     params: {
 *       query: {
 *         limit: 10,
 *         offset: index * 10,
 *       },
 *     },
 *   };
 * });
 * ```
 */
export function createInfiniteHook<
  Paths extends {},
  IMediaType extends MediaType,
  Prefix extends string,
>(client: Client<Paths, IMediaType>, prefix: Prefix) {
  type GetPath = PathsWithMethod<Paths, "get">;
  type GetRequest<Path extends GetPath> = FilterKeys<Paths[Path], "get">;
  type GetInit<Path extends GetPath> = FetchOptions<GetRequest<Path>>;
  type GetData<
    Path extends GetPath,
    Init extends GetInit<Path>,
  > = ParseAsResponse<
    FilterKeys<
      SuccessResponse<ResponseObjectMap<GetRequest<Path>>>,
      IMediaType
    >,
    Init
  >;
  type GetError<Path extends GetPath> = FilterKeys<
    ErrorResponse<ResponseObjectMap<GetRequest<Path>>>,
    IMediaType
  >;

  return function useInfinite<
    Path extends GetPath,
    Init extends GetInit<Path>,
    Data extends GetData<Path, Init>,
    Error extends GetError<Path>,
    Config extends SWRInfiniteConfiguration<Data, Error>,
  >(
    path: Path,
    getInit: SWRInfiniteKeyLoader<Data, Init | null>,
    config?: Config,
  ) {
    type Key = [Prefix, Path, Init] | null;
    type KeyLoader = SWRInfiniteKeyLoader<Data, Key>;

    const fetcher: SWRInfiniteFetcher<Data, KeyLoader> = async ([
      _,
      path,
      init,
    ]) => {
      const res = await client.GET(path, init);
      if (res.error) {
        throw res.error;
      }
      return res.data as Data;
    };

    const getKey: KeyLoader = (index, previousPageData) => {
      const init = getInit(index, previousPageData);
      if (init === null) {
        return null;
      }
      const key: Key = [prefix, path, init];
      return key;
    };

    return useSWRInfinite<Data, Error, KeyLoader>(getKey, fetcher, config);
  };
}
