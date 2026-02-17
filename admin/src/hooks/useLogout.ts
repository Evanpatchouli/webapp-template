import { useLoginStore } from "@/auth/store";
import { useNavigate } from "react-router";
import { useEvent } from "./useEmitter";

export default function useLogout() {
  const nav = useNavigate();
  const loginStore = useLoginStore();

  useEvent("user.logout", () => {
    loginStore.logout();
    nav("/login");
  });

  return true;
}
