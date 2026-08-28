import { useLoginStore } from "@/auth/store";
import { useNavigate } from "react-router";
import { useEvent } from "./useEmitter";
import { logout } from "@/api/user.api";

export default function useLogout() {
  const nav = useNavigate();
  const loginStore = useLoginStore();

  useEvent("user.logout", () => {
    void logout()
      .then((res) => {
        console.log("logout", res);
      })
      .catch((error) => {
        console.error("logout failed", error);
      })
      .finally(() => {
        loginStore.logout();
        nav("/login", { replace: true });
      });
  });

  return true;
}
