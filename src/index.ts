import type {
  ErrorResponseJSON,
  FilterKeys,
  PathsWithMethod,
  SuccessResponseJSON,
} from "openapi-typescript-helpers";
import type { SWRConfiguration, SWRResponse } from "swr";

export * from "./query.js";

export type RequestTypes<
  Paths extends object,
  Path extends PathsWithMethod<Paths, "get">,
  Req = FilterKeys<Paths[Path], "get">,
  Data = SuccessResponseJSON<Req>,
  Error = ErrorResponseJSON<Req>,
  Params = Req extends { parameters: infer P } ? P : never,
  PathParams = Params extends { path?: infer P } ? P : never,
  QueryParams = Params extends { query?: infer Q } ? Q : never,
  HeaderParams = Params extends { header?: infer H } ? H : never,
  CookieParams = Params extends { cookie?: infer C } ? C : never,
  SWRConfig = SWRConfiguration<Data, Error>,
> = {
  Data: Data;
  Error: Error;
  PathParams: PathParams;
  QueryParams: QueryParams;
  Headers: HeaderParams;
  Cookies: CookieParams;
  SWRConfig: SWRConfig;
  SWRResponse: SWRResponse<Data, Error, SWRConfig>;
};
