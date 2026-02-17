import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";
import type { PaginatedResult } from "@/types/resp";

const appRequest = createAppRequest("/admin/user-manage");

export const queryUserPage = (params: {
  page: number;
  size: number;
}): Promise<Resp<PaginatedResult<Record<string, any>[]>>> =>
  appRequest.get("/", { params });
