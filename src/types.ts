import type { Middleware } from "openapi-typescript-fetch";

type Method = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export type OpenApiPaths<Paths> = {
  [P in keyof Paths]: {
    [M in Method]?: unknown;
  };
};

export type FetchConfig = {
  baseUrl?: string;
  init?: RequestInit;
  use?: Middleware[];
};

type Gettable = {
  get: unknown;
};

export type OnlyGet<T> = {
  [K in keyof T as T[K] extends Gettable ? K : never]: T[K];
};
