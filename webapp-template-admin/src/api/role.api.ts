import { createAppRequest } from "./request";

const appRequest = createAppRequest("/admin/role");
export const queryAllRoles = (params: { simplify?: boolean }) => appRequest.get("/", { params });
