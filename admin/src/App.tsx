import { RouterView } from "./router";
import { useEffect } from "react";
import { initializeSession } from "./auth/session";
import "./App.css";

function App() {
  useEffect(initializeSession, []);

  return <RouterView />;
}

export default App;
