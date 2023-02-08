import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GiftedChat } from "react-native-gifted-chat";
import { Dimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function MessagesContent({ navigation }) {
  const [messages, setMessages] = useState([
    {
      _id: 123,
      text: "This is a test of Gifted Chat for the WEB 🎉 \n https://github.com/FaridSafi/react-native-gifted-chat ",
      user: {
        _id: 2,
        name: "you",
        avatar: "/me.jpg"
      },
      createdAt: new Date()
    },
    {
      _id: 456,
      text: "Find source code here: \n https://github.com/xcarpentier/gifted-chat-web-demo",
      user: {
        _id: 2,
        name: "you",
        avatar: "/me.jpg"
      },
      createdAt: new Date()
    }
  ]);
  const onSend = (newMsg) => setMessages([...messages, ...newMsg]);
  const user = { _id: 1, name: "me" };
  const inverted = false;
  const { width, height } = Dimensions.get("window");

  return (
    <SafeAreaProvider>
      <View style={{ width, height }}>
        <GiftedChat {...{ messages, onSend, user, inverted }} />
      </View>
    </SafeAreaProvider>
  );
}

const MessagesStack = createNativeStackNavigator();

function MessagesScreen() {
  return (
    <MessagesStack.Navigator>
      <MessagesStack.Screen name="Wiadomości" component={MessagesContent} />
    </MessagesStack.Navigator>
  );
}

export default MessagesScreen;
