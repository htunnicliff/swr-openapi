<p align="center">
  <h1 align="center">swr-openapi</h1>
</p>

<p align="center">Generate <a href="https://swr.vercel.app"><code>swr</code></a> hooks using <a href="https://swagger.io/specification/">OpenAPI</a> schemas</p>

<p align="center">
  <a aria-label="npm" href="https://www.npmjs.com/package/swr-openapi">
    <img alt="npm" src="https://img.shields.io/npm/v/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="license" href="https://github.com/htunnicliff/swr-openapi/blob/main/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/htunnicliff/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
</p>

## Installation

```sh
npm install swr-openapi swr openapi-fetch
```

## Setup

Follow [openapi-typescript](https://openapi-ts.pages.dev/) directions to generate TypeScript definitions for each service being used.

Here is an example of types being generated for a service via the command line:

```sh
npx openapi-typescript "https://sandwiches.example/openapi/json" --output ./types/sandwich-schema.ts
```

Initialize an [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/) client and create any desired hooks.

```ts
// sandwich-api.ts
import createClient from "openapi-fetch";
import { createQueryHook } from "swr-openapi";
import type { paths as SandwichPaths } from "./types/sandwich-schema";

const client = createClient<SandwichPaths>(/* ... */);

const useSandwiches = createQueryHook(client, "sandwich-api");

const { data, error, isLoading, isValidating, mutate } = useSandwiches(
  "/sandwich/{id}", // <- Fully typed paths!
  {
    params: {
      path: {
        id: "123", // <- Fully typed params!
      },
    },
  }
);
```

Wrapper hooks are provided 1:1 for each hook exported by SWR.

# API Reference

- [Hook Builders](#hook-builders)
- [`useQuery`](#useQuery)
- [`useImmutable`](#useImmutable)
- [`useInfinite`](#useInfinite)
- [`useMutate`](#useMutate)

## Hook Builders

```ts
import createClient from "openapi-fetch";
import { createQueryHook } from "swr-openapi"; // or "swr-openapi/query"
import { createImmutableHook } from "swr-openapi/immutable";
import { createInfiniteHook } from "swr-openapi/infinite";
import { paths as SomeApiPaths } from "./some-api";

const client = createClient<SomeApiPaths>(/* ... */);
const prefix = "some-api";

export const useQuery = createQueryHook(client, prefix);
export const useImmutable = createImmutableHook(client, prefix);
export const useInfinite = createInfiniteHook(client, prefix);
```

### Parameters

Each builder hook accepts the same parameters:

- `client`: An OpenAPI fetch [client][oai-fetch-client].
- `prefix`: A prefix unique to the fetch client.

### Returns

- `createQueryHook` &rarr; [`useQuery`](#usequery)
- `createImmutableHook` &rarr; [`useImmutable`](#useimmutable)
- `createInfiniteHook` &rarr; [`useInfinite`](#useinfinite)

## `useQuery`

```ts
const useQuery = createQueryHook(/* ... */);

const { data, error, isLoading, isValidating, mutate } = useQuery(
  path,
  init,
  config
);
```

<details>
<summary>How <code>useQuery</code> works</summary>

`useQuery` is a very thin wrapper over [`useSWR`][swr-api]. Most of the code involves TypeScript generics that are transpiled away.

The prefix supplied in `createQueryHook` is joined with `path` and `init` to form the key passed to SWR.

> `prefix` is only used to help ensure uniqueness for SWR's cache, in the case that two or more API clients share an identical path (e.g. `/api/health`). It is not included in actual `GET` requests.

Then, `GET` is invoked with `path` and `init`. Short and sweet.

```ts
function useQuery(path, ...[init, config]) {
  return useSWR(
    init !== null ? [prefix, path, init] : null,
    async ([_prefix, path, init]) => {
      const res = await client.GET(path, init);
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    config
  );
}
```

</details>

### Parameters

- `path`: Any endpoint that supports `GET` requests.
- `init`:
  - [Fetch options][oai-fetch-options] for the chosen endpoint (optional when no params are required by the endpoint).
  - `null` to skip the request (see [SWR Conditional Fetching][swr-conditional-fetching]).
- `config`: [SWR options][swr-options] (optional).

### Returns

- An [SWR response][swr-response].

## `useImmutable`

```ts
const useImmutable = createImmutableHook(/* ... */);

const { data, error, isLoading, isValidating, mutate } = useImmutable(
  path,
  init,
  config
);
```

This hook has the same contracts as `useQuery`. However, instead of wrapping [`useSWR`][swr-api], it wraps `useSWRImmutable`. This immutable hook [disables automatic revalidations][swr-disable-auto-revalidate] but is otherwise identical to `useSWR`.

### Parameters

Identical to `useQuery` [parameters](#parameters-1).

### Returns

Identical to `useQuery` [returns](#returns-1).

## `useInfinite`

```ts
const useInfinite = createInfiniteHook(/* ... */);

const { data, error, isLoading, isValidating, mutate, size, setSize } =
  useInfinite(path, getInit, config);
```

<details>
<summary>How <code>useInfinite</code> works</summary>

Just as `useQuery` is a thin wrapper over [`useSWR`][swr-api], `useInfinite` is a thin wrapper over [`useSWRInfinite`][swr-infinite].

Instead of using static [fetch options][oai-fetch-options] as part of the SWR key, `useInfinite` is given a function ([`getInit`](#getinit)) that should dynamically determines the fetch options based on the current page index and the data from a previous page.

```ts
function useInfinite(path, getInit, config) {
  const fetcher = async ([_, path, init]) => {
    const res = await client.GET(path, init);
    if (res.error) {
      throw res.error;
    }
    return res.data;
  };
  const getKey = (index, previousPageData) => {
    const init = getInit(index, previousPageData);
    if (init === null) {
      return null;
    }
    const key = [prefix, path, init];
    return key;
  };
  return useSWRInfinite(getKey, fetcher, config);
}
```

</details>

### Parameters

- `path`: Any endpoint that supports `GET` requests.
- `getInit`: A function that returns the fetch options for a given page ([learn more](#getinit)).
- `config`: [SWR infinite options][swr-infinite-options] (optional).

### Returns

- An [SWR infinite response][swr-infinite-return].

### `getInit`

This function is similar to the [`getKey`][swr-infinite-options] parameter accepted by `useSWRInfinite`, with some slight alterations to take advantage of Open API types.

#### Parameters

- `pageIndex`: The zero-based index of the current page to load.
- `previousPageData`:
  - `undefined` (if on the first page).
  - The fetched response for the last page retrieved.

#### Should Return

- [Fetch options][oai-fetch-options] for the next page to load.

#### Examples

<details>
<summary>Example using limit and offset</summary>

```ts
useInfinite("/something", (pageIndex, previousPageData) => {
  // No more pages
  if (previousPageData && !previousPageData.hasMore) {
    return null;
  }

  // First page
  if (!previousPageData) {
    return {
      params: {
        query: {
          limit: 10,
        },
      },
    };
  }

  // Next page
  return {
    params: {
      query: {
        limit: 10,
        offset: 10 * pageIndex,
      },
    },
  };
});
```

</details>

<details>
<summary>Example using cursors</summary>

```ts
useInfinite("/something", (pageIndex, previousPageData) => {
  // No more pages
  if (previousPageData && !previousPageData.nextCursor) {
    return null;
  }

  // First page
  if (!previousPageData) {
    return {
      params: {
        query: {
          limit: 10,
        },
      },
    };
  }

  // Next page
  return {
    params: {
      query: {
        limit: 10,
        cursor: previousPageData.nextCursor,
      },
    },
  };
});
```

</details>

## `useMutate`

[oai-fetch-client]: https://openapi-ts.pages.dev/openapi-fetch/api#createclient
[oai-fetch-options]: https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options
[swr-options]: https://swr.vercel.app/docs/api#options
[swr-conditional-fetching]: https://swr.vercel.app/docs/conditional-fetching#conditional
[swr-response]: https://swr.vercel.app/docs/api#return-values
[swr-disable-auto-revalidate]: https://swr.vercel.app/docs/revalidation.en-US#disable-automatic-revalidations
[swr-api]: https://swr.vercel.app/docs/api
[swr-infinite]: https://swr.vercel.app/docs/pagination#useswrinfinite
[swr-infinite-return]: https://swr.vercel.app/docs/pagination#return-values
[swr-infinite-options]: https://swr.vercel.app/docs/pagination#parameters
