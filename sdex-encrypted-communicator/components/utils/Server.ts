import Config from "react-native-config";
import { io } from "socket.io-client";

export const socket = io.connect(Config.API_URL);
