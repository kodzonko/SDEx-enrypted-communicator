import { createContext } from "react";

const AuthContext = createContext({
  isSignedIn: false,
  setIsSignedIn: () => {
  },
  keyPair: null,
  setKeyPair: () => {
  }
});

export default AuthContext;
