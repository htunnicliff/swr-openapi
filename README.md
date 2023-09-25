<p align="center">
  <h1 align="center">swr-openapi</h1>
</p>

<p align="center">Generate <a href="https://swr.vercel.app"><code>swr</code></a> hooks using <a href="https://swagger.io/specification/">OpenAPI</a> schemas</p>

<p align="center">
  <a aria-label="npm" href="https://www.npmjs.com/package/swr-openapi">
    <img alt="npm" src="https://img.shields.io/npm/v/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="license" href="https://github.com/htunnicliff/swr-openapi/blob/master/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/htunnicliff/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
</p>

## Installation

```sh
npm install swr-openapi swr
npm install --save-dev openapi-typescript
```

## Setup

For each Open API schema you want to use, run the following command to transform each schema into TypeScript types:

```sh
npx openapi-typescript "https://sandwiches.example/openapi/json" --output ./types/sandwich-schema.ts
```

Once you have types for your API saved, create an API client:

```ts
// sandwich-api.ts
import type * as SandwichSchema from "./types/sandwich-schema";

// 👇👇👇
export const sandwichAPI = createClient<SandwichSchema.paths>({
  baseUrl: "https://sandwiches.example",
});
```

Now, initialize a hook factory for that API:

```ts
// sandwich-api.ts
import { makeHookFactory } from "swr-openapi";
import type * as SandwichSchema from "./types/sandwich-schema";

export const sandwichAPI = createClient<SandwichSchema.paths>({
  baseUrl: "https://sandwiches.example",
});

// 👇👇👇
const makeHook = makeHookFactory<SandwichSchema.paths>(sandwichAPI);
```

> **Info**
> When working with multiple APIs, you can customize the name of each hook factory to suite your application:
>
> ```ts
> const fooAPI = createClient(...);
> const makeFooHook = makeHookFactory(fooAPI);
>
> const barAPI = createClient(...);
> const makeBarHook = makeHookFactory(barAPI);
> ```

With setup now out of the way, you can define the actual hooks used by your application:

```ts
// sandwich-api.ts
import { makeHookFactory } from "swr-openapi";
import type * as SandwichSchema from "./types/sandwich-schema";

export const sandwichAPI = createClient<SandwichSchema.paths>({
  baseUrl: "https://sandwiches.example",
});

const makeHook = makeHookFactory<SandwichSchema.paths>(sandwichAPI);

// 👇👇👇
export const useSandwichesForUser = makeHook("/user/{userId}/sandwiches");
export const useSandwiches = makeHook("/sandwiches");
```

Now, you can call the hooks elsewhere in your application:

```tsx
import { useSandwiches, useSandwichesForUser } from "./sandwich-api";

export function UserSandwiches() {
  const { data: sandwiches } = useSandwiches({
    params: {
      query: { limit: 10 },
    },
  });

  const { data: userSandwiches } = useSandwichesForUser({
    params: {
      path: { userId: "user-123" },
    },
  });

  // ...
}
```
