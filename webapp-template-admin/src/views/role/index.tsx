import { useEffect, useState } from "react";
import * as RoleAPI from "../../api/role.api";

export default function RoleView() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    RoleAPI.queryAllRoles({ simplify: true }).then((data) => {
      console.log(data);
    });
  }, []);
  return (
    <div>
      <h1>Role</h1>
      {/* <RoleForm /> */}
    </div>
  );
}
