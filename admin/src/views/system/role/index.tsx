import { useEffect, useState } from "react";
import * as RoleAPI from "@/api/role.api";

export default function RoleView() {
  const [roles, setRoles] = useState<any[]>([]);
  useEffect(() => {
    RoleAPI.queryAllRoles({ simplify: true }).then((resp) => {
      setRoles(resp.getData() || []);
    });
  }, []);
  return (
    <div>
      <h1>Role</h1>
      <pre>{JSON.stringify(roles, null, 2)}</pre>
    </div>
  );
}
