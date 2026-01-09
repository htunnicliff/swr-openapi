import type { Client } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod } from "openapi-typescript-helpers";
import { useCallback, useDebugValue } from "react";
import useSWRMutation from "swr/mutation";
import type { SWRMutationConfiguration
} from "swr/mutation";
import type { Exact } from "type-fest";
import type { MutationMethod, TypesForRequest } from "./types.js";

/**
 * Produces a typed wrapper for [`useSWRMutation`](https://swr.vercel.app/docs/mutation#useswrmutation).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 * import { createMutationHook } from "swr-openapi";
 *
 * const client = createClient();
 *
 * const usePostMutation = createMutationHook(client, "post", "<unique-key>");
 * const usePutMutation = createMutationHook(client, "put", "<unique-key>");
 * const useDeleteMutation = createMutationHook(client, "delete", "<unique-key>");
 *
 * // In a component:
 * function AddPet() {
 *   const { trigger, isMutating } = usePostMutation("/pet");
 *
 *   const handleAdd = async () => {
 *     await trigger({
 *       body: { name: "doggie", photoUrls: ["https://example.com/photo.jpg"] }
 *     });
 *   };
 *
 *   return <button onClick={handleAdd} disabled={isMutating}>Add Pet</button>;
 * }
 * ```
 */
export function createMutationHook<
  Paths extends {},
  IMediaType extends MediaType,
  Method extends MutationMethod & Extract<HttpMethod, keyof Paths[keyof Paths]>,
  Prefix extends string,
>(client: Client<Paths, IMediaType>, method: Method, prefix: Prefix) {
  const clientMethod = method.toUpperCase() as Uppercase<Method>;

  return function useMutation<
    Path extends PathsWithMethod<Paths, Method>,
    R extends TypesForRequest<Paths, Method, Path>,
    Init extends Exact<R["Init"], Init>,
    Data extends R["Data"],
    Error extends R["Error"],
    Config extends SWRMutationConfiguration<Data, Error, readonly [Prefix, Method, Path], Init>,
  >(
    path: Path,
    config?: Config,
  ) {
    useDebugValue(`${prefix} - ${method} ${path as string}`);

    type Key = readonly [Prefix, Method, Path];
    const key = [prefix, method, path] as const;

    const fetcher = useCallback(
      async ([_prefix, _method, path]: Key, { arg }: { arg: Init }) => {
        // @ts-expect-error - Dynamic method call on client
        const res = await client[clientMethod](path, arg);
        if (res.error) {
          throw res.error;
        }
        return res.data as Data;
      },
      [client, clientMethod],
    );

    return useSWRMutation<Data, Error, Key, Init>(key, fetcher, config);
  };
}
