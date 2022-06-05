<p align="center">
  <h1 align="center">swr-openapi</h1>
</p>

<p align="center">Generate <a href="https://swr.vercel.app"><code>swr</code></a> hooks from <a href="https://swagger.io/specification/">OpenAPI</a> schemas</p>

<p align="center">
  <a aria-label="npm" href="https://www.npmjs.com/package/swr-openapi">
    <img alt="npm" src="https://img.shields.io/npm/v/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="license" href="https://github.com/htunnicliff/swr-openapi/blob/master/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/htunnicliff/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
  <!-- <a aria-label="tests" href="https://github.com/htunnicliff/swr-openapi/actions?query=workflow%3ATest">
    <img alt="tests" src="https://img.shields.io/github/workflow/status/htunnicliff/swr-openapi/Test?style=for-the-badge&labelColor=000000&label=Tests">
  </a>
  <a aria-label="coverage" href="https://codecov.io/gh/htunnicliff/swr-openapi/">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/htunnicliff/swr-openapi?style=for-the-badge&labelColor=000000&token=XI7G8L08TY">
  </a> -->
</p>

## How to Use

First, follow the [directions for openapi-typescript](https://www.npmjs.com/package/openapi-typescript) to generate TypeScript types for a given API.

In the following example, we will assume that types for a "Pet Store" API have been generated at `./types/pet-store.d.ts`.

```tsx
import { SWRApiFactory } from "swr-openapi";
import { Paths as PetStorePaths }from "./types/pet-store";

// Create factory for the API
const petStoreService = new SWRApiFactory<PetStorePaths>({
  baseURL: "https://example.com/api/petstore",
});

// Create SWR hooks for specific endponts
export [usePets] = petStoreService.makeHook("/pets");
export [usePet] = petStoreService.makeHook("/pets/{petId}");
export [usePetImages] = petStoreService.makeHook("/pets/{petId}/images");

// Call hooks with arguments
function PetList() {
  const { data: pets } = usePets();

  // Render list of pets (`pets` is fully type-safe!)
}

function PetProfile() {
  const { data: pet } = usePet({ petId: 'pet-123' });
  const { data: petImages } = usePetImages(); // <-- Type Error: Missing `petId` argument

  // Render pet profile
}
```

The `SWRApiFactory` class accepts all arguments that are supported by [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) in addition to other library features like middleware and typed error handling.
