import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatRoomsScreen from "../screens/ChatRoomsScreen";
import ChatScreen from "../screens/ChatScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { ChatRoomsStackNavigationParamList } from "../Types";

const ChatRoomsStack = createNativeStackNavigator<ChatRoomsStackNavigationParamList>();

function ChatRoomsStackNavigator() {
  return (
    <ChatRoomsStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={"ChatRooms"}
    >
      <ChatRoomsStack.Screen name="ChatRooms" component={ChatRoomsScreen} />
      <ChatRoomsStack.Screen name="Chat" component={ChatScreen} />
      <ChatRoomsStack.Screen name="Settings" component={SettingsScreen} />
    </ChatRoomsStack.Navigator>
  );
}

export default ChatRoomsStackNavigator;
