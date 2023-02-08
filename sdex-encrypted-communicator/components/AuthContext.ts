import { createContext } from "react";
import { IAuthContextCombined } from "../utils/types";

const AuthContext = createContext<IAuthContextCombined>({
  isSignedIn: false,
  // tslint:disable-next-line:no-empty
  setIsSignedIn: () => {
  },
  keyPair: null,
  // tslint:disable-next-line:no-empty
  setKeyPair: () => {
  }
});

export default AuthContext;
