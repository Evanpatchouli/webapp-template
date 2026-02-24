// import { type BaseQueryPageParams, type PaginatedResult } from '@webapp-template/common';
import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/login-log");

export const count = (
  range: "daily" | "weekly" | "monthly" | "yearly",
): Promise<Resp<number>> => appRequest.get(`/count/${range}`);
