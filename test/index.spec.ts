import createClient from "openapi-fetch";
import type { paths } from "../petstore";
import { makeHookFactory } from "../src/index";

import { expectTypeOf } from "expect-type";

const petStoreApi = createClient<paths>({
  baseUrl: "https://petstore3.swagger.io/api/v3",
});

const petStoreHook = makeHookFactory<paths>(petStoreApi, "pet-store");

const useOrder = petStoreHook("/store/order/{orderId}");

const { data } = useOrder({
  params: {
    path: { orderId: 1 },
  },
});

if (data) {
  expectTypeOf(data).toEqualTypeOf<
    paths["/store/order/{orderId}"]["get"]["responses"]["200"]["content"]["application/json"]
  >();
}
