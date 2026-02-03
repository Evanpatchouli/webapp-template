import type { Nullable } from "./utils";

export interface Resp<T> {
  code: number | string;
  message: string;
  data: Nullable<T>;
}
