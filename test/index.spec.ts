import createClient from "openapi-fetch";
import type { paths } from "../generated/petstore";
import { makeHookFactory } from "../src/index";

import { expectTypeOf } from "expect-type";
import { SuccessResponseJSON } from "openapi-typescript-helpers";

const petStoreApi = createClient<paths>({
  baseUrl: "https://petstore3.swagger.io/api/v3",
});

const petStoreHook = makeHookFactory<paths>(petStoreApi, "pet-store");

const useOrder = petStoreHook("/store/order/{orderId}");

type OrderSuccessResponse = SuccessResponseJSON<
  paths["/store/order/{orderId}"]["get"]
>;

// Test regular hook
const { data } = useOrder({
  params: {
    path: { orderId: 1 },
  },
});

expectTypeOf(data).not.toEqualTypeOf<OrderSuccessResponse>();
expectTypeOf(data).toEqualTypeOf<undefined | OrderSuccessResponse>();

if (data) {
  expectTypeOf(data).toEqualTypeOf<OrderSuccessResponse>();
}

// Test suspense hook
const { data: suspenseData } = useOrder(
  {
    params: {
      path: { orderId: 1 },
    },
  },
  { suspense: true }
);

expectTypeOf(suspenseData).toEqualTypeOf<OrderSuccessResponse>();
