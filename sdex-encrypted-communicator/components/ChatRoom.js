import {Pressable, Text} from "react-native";

const ChatRoom = ({id, name, surname, msgCount, lastMsgDate}) => {
    return (
        <Pressable>
            <View>
                <Text>{name} {surname} ({msgCount})</Text>
                <Text>{lastMsgDate}</Text>
            </View>
        </Pressable>
    );
}

export default ChatRoom;