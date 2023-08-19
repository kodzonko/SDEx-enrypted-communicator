import { Alert } from "react-native";
import Toast from "react-native-root-toast";
import { io } from "socket.io-client";
import logger from "../Logger";

const SERVER_ADDRESS = "ws://10.0.2.2:3000";

const socket = io(
  SERVER_ADDRESS,
  {
    path: "/ws/socket.io/",
    timeout: 10000,
    transports: ["websocket", "polling"],
  } /* { auth: { token: "test" } } */,
);

socket.on("connect", () => {
  Toast.show("Połączono z serwerem.", {
    duration: Toast.durations.SHORT,
  });
});

socket.on("disconnect", (reason) => {
  Alert.alert("Utracono połączenie z serwerem", reason);
});

socket.on("test", (data) => {
  logger.info(`data=${data}`);
});

export default socket;
