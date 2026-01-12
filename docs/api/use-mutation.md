---
title: useMutation
---

# {{ $frontmatter.title }}

`useMutation` is a wrapper around SWR's [useSWRMutation][swr-mutation] hook. It provides a type-safe way to perform remote mutations (POST, PUT, PATCH, DELETE) with full OpenAPI type inference.

```ts
const { trigger, isMutating } = useMutation("post", "/pet");

await trigger({
  body: { name: "doggie", photoUrls: ["https://example.com/photo.jpg"] }
});
```

## API

### Parameters

- `method`: The HTTP method to use (`"post"`, `"put"`, `"patch"`, or `"delete"`).
- `path`: Any endpoint that supports the specified method.
- `config`: (_optional_) [SWR mutation configuration][swr-mutation-options].

### Returns

Returns the same object as [useSWRMutation][swr-mutation]:

- `trigger`: A function to trigger the mutation. Accepts the request init (body, params, etc.).
- `isMutating`: Whether the mutation is currently in progress.
- `data`: The data returned from a successful mutation.
- `error`: The error thrown if the mutation failed.
- `reset`: A function to reset the state.

## Usage Examples

### POST - Create a resource

```ts
function AddPet() {
  const { trigger, isMutating } = useMutation("post", "/pet");

  const handleSubmit = async (data: PetData) => {
    await trigger({
      body: { name: data.name, photoUrls: data.photos }
    });
  };

  return (
    <button onClick={() => handleSubmit(formData)} disabled={isMutating}>
      {isMutating ? "Adding..." : "Add Pet"}
    </button>
  );
}
```

### PUT - Update a resource

```ts
function UpdatePet() {
  const { trigger } = useMutation("put", "/pet");

  const handleUpdate = async (pet: Pet) => {
    await trigger({
      body: { id: pet.id, name: pet.name, photoUrls: pet.photoUrls }
    });
  };

  return <button onClick={() => handleUpdate(pet)}>Update</button>;
}
```

### DELETE - Remove a resource

```ts
function DeletePet({ petId }: { petId: number }) {
  const { trigger, isMutating } = useMutation("delete", "/pet/{petId}");

  const handleDelete = async () => {
    await trigger({
      params: { path: { petId } }
    });
  };

  return (
    <button onClick={handleDelete} disabled={isMutating}>
      Delete
    </button>
  );
}
```

## Cache Key

The cache key format is `[prefix, method, path]`. This ensures mutations to the same path with different methods don't collide in the cache.

[swr-mutation]: https://swr.vercel.app/docs/mutation#useswrmutation
[swr-mutation-options]: https://swr.vercel.app/docs/mutation#useswrmutation-parameters
