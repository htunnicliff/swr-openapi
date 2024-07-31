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
npm install --save-dev openapi-typescript typescript
```

## Setup

Follow [openapi-typescript](https://openapi-ts.pages.dev/) directions to generate TypeScript definitions for each service being used.

Here is an example of types being generated for a service via the command line:

```sh
npx openapi-typescript "https://sandwiches.example/openapi/json" --output ./types/sandwich-schema.ts
```

Then, create an [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/) client and initialize [swr](https://swr.vercel.app/) hooks for the API:

<!-- prettier-ignore -->
```ts
// sandwich-api.ts
import createClient from "openapi-fetch";
import { createHooks } from "swr-openapi";
import type * as SandwichesSchema from "./types/sandwich-schema";

export const sandwichesApi = createClient<SandwichesSchema.paths>({
  baseUrl: "https://sandwiches.example",
});

export const {
  use: useSandwiches,
  useInfinite: useSandwichesInfinite,
} = createHooks(sandwichesApi, "sandwich-api");
```

## Usage

```tsx
import { useSandwiches } from "./sandwich-api";

export function MySandwiches() {
  // Fetch a single sandwich (uses useSWR)
  const { data: sandwiches } = useSandwiches("/sandwiches/{sandwichId}", {
    params: {
      path: {
        sandwichId: "sandwich-123",
      },
    },
  });

  // Fetch multiple pages of sandwiches (uses useSWRInfinite)
  const {
    data: pages,
    size,
    setSize,
  } = useSandwichesInfinite("/sandwiches", (index, previous) => {
    if (!previous.hasMore) {
      return null;
    }

    return {
      params: {
        query: {
          limit: 25,
          offset: 25 * index,
        },
      },
    };
  });
}
```

## API Reference

### `createHooks(api, keyPrefix)`

- Parameters:
  - `api`: An openapi-fetch client.
  - `keyPrefix`: A string to differentiate this API from others. This helps avoid swr cache collisions when using multiple APIs that may have identical paths.
- Returns:
  - [`use`](#usepath-options-swrconfig): A wrapper over [`useSWR`][swr-api] bound to the given api.
  - [`useInfinite`](#useinfinitepath-getoptionsfn-swrconfig): A wrapper over [`useSWRInfinite`][swr-infinite-api] bound to the given api.

Depending on your project preferences, there are different ways to export the return value of `createHooks`. Here are two examples:

<details>
<summary><b>Option 1: Destructure the return value and rename the destructured properties</b></summary>

<!-- prettier-ignore -->
```ts
// sandwich-api.ts
export const {
  use: useSandwiches,
  useInfinite: useSandwichesInfinite
} = createHooks(sandwichesApi, "sandwich-api");
```

```ts
// some-component.tsx
import { useSandwiches } from "./sandwich-api";

export function SomeComponent() {
  const { data, error, isLoading } = useSandwiches("/sandwiches/{sandwichId}", {
    params: {
      path: {
        sandwichId: "sandwich-123",
      },
    },
  });
}
```

</details>

<details>
<summary><b>Option 2: Don't destructure the return value</b></summary>

```ts
// sandwich-api.ts
export const sandwiches = createHooks(sandwichesApi, "sandwich-api");
```

```ts
// some-component.tsx
import { sandwiches } from "./sandwich-api";

export function SomeComponent() {
  const { data, error, isLoading } = sandwiches.use(
    "/sandwiches/{sandwichId}",
    {
      params: {
        path: {
          sandwichId: "sandwich-123",
        },
      },
    },
  );
}
```

</details>

### `use(path, options, swrConfig)`

```ts
function use(
  path: Path,
  options: Options | null,
  swrConfig?: Config,
): SWRResponse;
```

- Parameters:
  - `path`: The GET endpoint to request.
  - `options`: Either
    1. An openapi-fetch [`FetchOptions`](https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options) object for the given path.
    2. `null` to support [conditional fetching](https://swr.vercel.app/docs/conditional-fetching).
  - `swrConfig` (optional): [Configuration options](https://swr.vercel.app/docs/api#options) for `useSWR`.
- Returns:
  - A [`useSWR` response](https://swr.vercel.app/docs/api#return-values).

```ts
const { data, error, isLoading, mutate, revalidate } = use(
  "/sandwiches/{sandwichId}",
  {
    params: {
      path: {
        sandwichId: "sandwich-123",
      },
    },
  },
);
```

### `useInfinite(path, getOptionsFn, swrConfig)`

```ts
function useInfinite(
  path: Path,
  getOptionsFn: SWRInfiniteKeyLoader<Data, Options | null>,
  swrConfig?: Config,
): SWRInfiniteResponse;
```

- Parameters:
  - `path`: The GET endpoint to request.
  - `getOptionsFn`: An swr [`getKey` function](https://swr.vercel.app/docs/pagination#parameters) that accepts the index and the previous page data, returning either an openapi-fetch [`FetchOptions`](https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options) object for loading the next page or `null`, once there are no more pages.
  - `swrConfig` (optional): [Configuration options](https://swr.vercel.app/docs/pagination#parameters) for `useSWRInfinite`.
- Returns:
  - A [`useSWRInfinite` response](https://swr.vercel.app/docs/pagination#return-values).

```ts
const {
  data: sandwichPages,
  error,
  isLoading,
  isValidating,
  mutate,
  size,
  setSize,
} = useInfinite("/sandwiches", (index, previousPage) => {
  if (!previousPage.hasMore) {
    return null;
  }

  return {
    params: {
      query: {
        limit: 25,
        offset: 25 * index,
      },
    },
  };
});
```

[swr-api]: https://swr.vercel.app/docs/api
[swr-infinite-api]: https://swr.vercel.app/docs/pagination#useswrinfinite
