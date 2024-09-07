import type { Client, FetchOptions, ParseAsResponse } from "openapi-fetch";
import type {
  ErrorResponse,
  FilterKeys,
  HasRequiredKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";
import useSWR, { type Fetcher, type SWRConfiguration } from "swr";

/**
 * ```ts
 * const client = createClient();
 *
 * const useQuery = createQueryHook(client, "<unique-key>");
 *
 * // Fetch the query
 * useQuery("/pets");
 *
 * // Skip the query
 * useQuery("/pets", null);
 *
 * // Fetch the query with parameters
 * useQuery("/pets", {
 *   params: { query: { limit: 10 } }
 * });
 *
 * // Fetch the query with parameters and SWR configuration
 * useQuery(
 *   "/pets",
 *   { params: { query: { limit: 10 } } },
 *   { revalidateOnFocus: false },
 * );
 *
 * // Fetch the query with no parameters and SWR configuration
 * useQuery(
 *   "/pets",
 *   {},
 *   { revalidateOnFocus: false },
 * );
 * ```
 */
export function createQueryHook<
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

  return function useQuery<
    Path extends GetPath,
    Init extends GetInit<Path>,
    Data extends GetData<Path, Init>,
    Error extends GetError<Path>,
    Config extends SWRConfiguration<Data, Error>,
  >(
    path: Path,
    ...[init, config]: HasRequiredKeys<Init> extends never
      ? [(Init | null)?, Config?]
      : [Init | null, Config?]
  ) {
    type Key = [Prefix, Path, Init] | null;

    const key: Key = init ? [prefix, path, init] : null;

    const fetcher: Fetcher<Data, Key> = async ([_, path, init]) => {
      const res = await client.GET(path, init);
      if (res.error) {
        throw res.error;
      }
      return res.data as Data;
    };

    if (config) {
      return useSWR<Data, Error, Key, Config>(key, fetcher, config);
    }

    return useSWR<Data, Error, Key>(key, fetcher);
  };
}
