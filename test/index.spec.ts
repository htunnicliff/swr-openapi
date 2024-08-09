import { expectTypeOf } from "expect-type";
import createClient from "openapi-fetch";
import { SuccessResponseJSON } from "openapi-typescript-helpers";
import type { paths } from "../generated/petstore";
import { createHooks, RequestTypes } from "../src/index";
import { mutate } from "swr";

const petStoreApi = createClient<paths>({
  baseUrl: "https://petstore3.swagger.io/api/v3",
});

type OrderSuccessResponse = SuccessResponseJSON<
  paths["/store/order/{orderId}"]["get"]
>;

expectTypeOf<OrderSuccessResponse>().not.toBeNever();

const {
  use: usePetStore,
  useInfinite: usePetStoreInfinite,
  matchKey,
} = createHooks<paths>(petStoreApi, "pet-store");

mutate(
  matchKey("/store/order/{orderId}", { params: { path: { orderId: 1 } } }),
);

// Test regular hook
const { data } = usePetStore("/store/order/{orderId}", {
  params: {
    path: {
      orderId: 1,
    },
  },
});

expectTypeOf(data).not.toEqualTypeOf<OrderSuccessResponse>();
expectTypeOf(data).toEqualTypeOf<undefined | OrderSuccessResponse>();

if (data) {
  expectTypeOf(data).toEqualTypeOf<OrderSuccessResponse>();
}

// Test suspense hook
const { data: suspenseData } = usePetStore(
  "/store/order/{orderId}",
  {
    params: {
      path: {
        orderId: 1,
      },
    },
  },
  { suspense: true },
);

expectTypeOf(suspenseData).toEqualTypeOf<OrderSuccessResponse>();

usePetStore("/store/order/{orderId}", {
  params: {
    path: {
      orderId: 1,
    },
  },
});

usePetStoreInfinite("/store/order/{orderId}", (index, previous) => ({
  params: {
    path: {
      orderId: 1,
    },
  },
}));

type Req = RequestTypes<paths, "/store/order/{orderId}">;

expectTypeOf<Req["Data"]>().toEqualTypeOf<OrderSuccessResponse>();
expectTypeOf<
  Parameters<NonNullable<Req["SWRConfig"]["onSuccess"]>>[0]
>().toEqualTypeOf<OrderSuccessResponse>();
