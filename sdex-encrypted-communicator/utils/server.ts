import { io } from "socket.io-client";
import Config from "react-native-config";

// @ts-expect-error TS(2339): Property 'connect' does not exist on type '{ (opts... Remove this comment to see the full error message
export const socket = io.connect(Config.API_URL);
