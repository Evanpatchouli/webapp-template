import type { Nullable } from "./utils";

export interface IResp<T = unknown> {
  code: number | string;
  message: string;
  data: Nullable<T>;
}
