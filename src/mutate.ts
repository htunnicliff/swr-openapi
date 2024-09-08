import type { Client, FetchOptions, ParseAsResponse } from "openapi-fetch";
import type {
  FilterKeys,
  HasRequiredKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";
import { useCallback } from "react";
import { type MutatorCallback, type MutatorOptions, useSWRConfig } from "swr";
import type { PartialDeep } from "type-fest";

/**
 * ```ts
 * import { isMatch } from "lodash";
 *
 * const client = createClient();
 *
 * const mutate = useMutate(client, "<unique-key>", isMatch);
 *
 * // Revalidate all keys matching this path
 * await mutate(["/pets"]);
 * await mutate(["/pets"], newData);
 * await mutate(["/pets"], undefined, { revalidate: true });
 *
 * // Revlidate all keys matching this path and this subset of options
 * await mutate(
 *   ["/pets", { query: { limit: 10 } }],
 *   newData,
 *   { revalidate: false }
 * );
 * ```
 */
export function useMutate<Paths extends {}, IMediaType extends MediaType>(
  _client: Client<Paths, IMediaType>,
  prefix: string,
  compare: (init: unknown, partialInit: unknown) => boolean,
) {
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

  const { mutate } = useSWRConfig();

  return useCallback(
    <
      Path extends GetPath,
      Init extends GetInit<Path>,
      Data extends GetData<Path, Init>,
    >(
      [path, init]: HasRequiredKeys<Init> extends never
        ? [Path, PartialDeep<Init>?]
        : [Path, Init],
      data?: Data | Promise<Data> | MutatorCallback<Data>,
      opts?: MutatorOptions<Data>,
    ) => {
      return mutate<Data>(
        (key) => {
          if (!Array.isArray(key) || key.length !== 3) {
            return false;
          }

          const [keyPrefix, keyPath, keyOptions] = key;

          return (
            // Matching prefix
            keyPrefix === prefix &&
            // Matching path
            keyPath === path &&
            // Matching options
            (init ? compare(keyOptions, init) : true)
          );
        },
        data,
        opts,
      );
    },
    [mutate, prefix, compare],
  );
}