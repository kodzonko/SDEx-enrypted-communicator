import { useNavigation } from "@react-navigation/native";
import React,{ useState } from "react";
import { Dimensions,SafeAreaView,View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";

import { Appbar } from "react-native-paper";

import { StackNavigationParamList } from "../Types";

function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      _id: 123,
      text: "Hej, masz chwilę?",
      user: {
        _id: 2,
        name: "you",
        avatar: "/me.jpg",
      },
      createdAt: new Date(),
    },
    {
      _id: 456,
      text: "Musimy pogadać :)",
      user: {
        _id: 2,
        name: "you",
        avatar: "/me.jpg",
      },
      createdAt: new Date(),
    },
  ]);
  const navigation = useNavigation<StackNavigation<StackNavigationParamList>>();
  const _goBack = () => navigation.goBack();
  const onSend = (newMsg: any) => setMessages([...messages, ...newMsg]);
  const user = {
    _id: 1,
    name: "me",
  };
  const inverted = false;
  const { width, height } = Dimensions.get("window");

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header>
        <Appbar.BackAction onPress={_goBack} />
        <Appbar.Content title="<username>" />
      </Appbar.Header>
      <View
        style={{
          width,
          height,
        }}
      >
        <GiftedChat
          {...{
            messages,
            onSend,
            user,
            inverted,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default ChatScreen;
