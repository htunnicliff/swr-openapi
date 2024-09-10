import type { Client, FetchOptions, ParseAsResponse } from "openapi-fetch";
import type {
  FilterKeys,
  MediaType,
  PathsWithMethod,
  RequiredKeysOf,
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
 * const useMutate = createMutateHook(client, "<unique-key>", isMatch);
 *
 * const mutate = useMutate();
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
export function createMutateHook<
  Paths extends {},
  IMediaType extends MediaType,
>(
  _client: Client<Paths, IMediaType>,
  prefix: string,
  // Types are loose here to support ecosystem utilities like _.isMatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compare: (init: any, partialInit: object) => boolean,
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

  return function useMutate() {
    const { mutate } = useSWRConfig();

    return useCallback(
      <
        Path extends GetPath,
        Init extends GetInit<Path>,
        Data extends GetData<Path, Init>,
      >(
        [path, init]: RequiredKeysOf<Init> extends never
          ? [Path, PartialDeep<Init>?]
          : [Path, Init],
        data?: Data | Promise<Data> | MutatorCallback<Data>,
        opts?: MutatorOptions<Data>,
      ) => {
        return mutate<Data>(
          (key) => {
            if (
              // Must be array
              !Array.isArray(key) ||
              // Must have 2 or 3 elements (prefix, path, optional init)
              ![2, 3].includes(key.length)
            ) {
              return false;
            }

            const [keyPrefix, keyPath, keyOptions] = key as unknown[];

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
  };
}
