import { RouterView } from "./router";
import { useEvent } from "./hooks/useEmitter";
import { useLoginStore } from "./auth/store";
import type UserInfo from "./types/userinfo";
import "./App.css";

function App() {
  const loginStore = useLoginStore();

  useEvent('user.login', result => {
    const { token, ...userInfo } = result;
    loginStore.setToken(token);
    loginStore.setUserInfo({
      nickname: "",
      ...userInfo,
    } as UserInfo)
    loginStore.setIsLogin(true);
  })

  return <RouterView />;
}

export default App;
