import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/admin/role");

interface Role {
  id: number;
  role_name: string;
  role_code: string;
  description: string;
  perrmissions: Permission[];
}

interface Permission {
  id: number;
  permission_name: string;
  permission_code: string;
  description: string;
}

export const queryAllRoles = (params: {
  withPermissions?: boolean;
  simplify?: boolean;
}): Promise<Resp<Array<Role>>> => appRequest.get("/", { params });
