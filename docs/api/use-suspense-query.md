---
title: useSuspenseQuery
---

# {{ $frontmatter.title }}

This hook is a typed wrapper over [`useSWR`][swr-api] with `suspense: true` enabled.

The key difference from `useQuery` is that `data` is always defined (non-optional), since React Suspense guarantees data is available before the component renders.

```ts
import createClient from "openapi-fetch";
import { createSuspenseQueryHook } from "swr-openapi";
import type { paths } from "./my-schema";

const client = createClient<paths>(/* ... */);

const useSuspenseQuery = createSuspenseQueryHook(client, "my-api");

// data is always defined (not data | undefined)
const { data, error, isValidating, mutate } = useSuspenseQuery(
  path,
  init,
  config,
);
```

## API

### Parameters

- `path`: Any endpoint that supports `GET` requests.
- `init`: (_sometimes optional_)
  - [Fetch options][oai-fetch-options] for the chosen endpoint.
  - `null` to skip the request (see [SWR Conditional Fetching][swr-conditional-fetching]).
- `config`: (_optional_) [SWR options][swr-options] (without `suspense`, which is always enabled).

### Returns

- An [SWR response][swr-response] where `data` is always defined (`Data` instead of `Data | undefined`).

## How It Works

`useSuspenseQuery` is nearly identical to [`useQuery`](./use-query.md), with two key differences:

1. The `suspense: true` option is always passed to SWR
2. The return type guarantees `data` is defined

```ts
function useSuspenseQuery(path, ...[init, config]) {
  return useSWR(
    init !== null ? [prefix, path, init] : null,
    async ([_prefix, path, init]) => {
      const res = await client.GET(path, init);
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    { ...config, suspense: true },
  );
}
```

::: tip

When using suspense, wrap your component with a `<Suspense>` boundary to handle the loading state:

```tsx
<Suspense fallback={<Loading />}>
  <MyComponent />
</Suspense>
```

:::


[oai-fetch-options]: https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options
[swr-options]: https://swr.vercel.app/docs/api#options
[swr-conditional-fetching]: https://swr.vercel.app/docs/conditional-fetching#conditional
[swr-response]: https://swr.vercel.app/docs/api#return-values
[swr-api]: https://swr.vercel.app/docs/api
