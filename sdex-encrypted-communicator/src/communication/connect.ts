import NetInfo from "@react-native-community/netinfo";
import { Buffer } from "buffer";
import TcpSocket from "react-native-tcp";
import { TLSSocket } from "tls";

const serverHost = "your-server-host";
const serverPort = 1234;
const tlsOptions: TLSSocket.TlsOptions = {
  host: serverHost,
  port: serverPort,
  rejectUnauthorized: false, // Set to `true` to verify the server's TLS certificate
};

const connectToServer = async () => {
  // Check if the device has an internet connection
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log("No internet connection");
    return;
  }

  // Create a TCP socket
  const socket = TcpSocket.createConnection({ port: serverPort, host: serverHost }, () => {
    // Connection successful
    console.log("Socket connected");

    // Create a TLS socket using the TCP socket
    const tlsSocket = new TLSSocket(socket, tlsOptions);

    // Handle data received from the server
    tlsSocket.on("data", (data: Buffer) => {
      console.log("Received data:", data.toString());
    });

    // Handle errors
    tlsSocket.on("error", (error: Error) => {
      console.log("Socket error:", error);
    });

    // Send data to the server
    tlsSocket.write("Hello, server!");
  });

  // Handle socket errors
  socket.on("error", (error: Error) => {
    console.log("Socket error:", error);
  });
};

connectToServer();
