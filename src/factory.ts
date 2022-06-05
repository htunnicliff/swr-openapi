import useSWR, { Fetcher as SWRFetcher, SWRConfiguration } from "swr";
import {
  Fetcher as OpenApiFetcher,
  FetchArgType,
  FetchErrorType,
  FetchReturnType,
} from "openapi-typescript-fetch";
import {
  FetchConfig,
  OpenapiPaths,
} from "openapi-typescript-fetch/dist/cjs/types";

type Gettable = {
  get: unknown;
};

type OnlyGet<T> = {
  [K in keyof T as T[K] extends Gettable ? K : never]: T[K];
};

export class SWRApiFactory<Paths extends OpenapiPaths<Paths>> {
  constructor(config: FetchConfig, public api = OpenApiFetcher.for<Paths>()) {
    // Initialize API fetcher
    api.configure(config);
  }

  /**
   * Create a pre-configured hook for a given API path
   */
  makeHook<Path extends keyof OnlyGet<Paths>>(path: Path) {
    // Create request
    const request = this.api.path(path).method("get").create();
    type Data = FetchReturnType<typeof request>;
    type Args = FetchArgType<typeof request>;
    type FetchError = FetchErrorType<typeof request>;

    // Configure cache key
    type CacheKey = [Path, Args];
    const getKey = (args: Args): CacheKey => [path, args];

    // Define SWR fetcher
    const fetcher: SWRFetcher<Data, CacheKey> = async ([, args]) => {
      const { data } = await request(args);
      return data;
    };

    // Create hook
    function useHook(
      args: Args | null,
      config?: SWRConfiguration<Data, FetchError, typeof fetcher>
    ) {
      const key = args ? getKey(args) : null;
      return useSWR<Data, FetchError>(key, fetcher, config);
    }

    return [
      useHook,
      {
        request,
        fetcher,
        getKey,
      },
    ] as const;
  }
}
