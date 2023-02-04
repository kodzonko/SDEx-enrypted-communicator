import * as React from "react";
import {FlatList, SafeAreaView, TouchableOpacity, View} from "react-native";
import {Divider, List} from 'react-native-paper';
import {formatDistance} from 'date-fns'
import pl from 'date-fns/locale/pl';

const room1 = {
    "id": 1, "name": "Jan", "surname": "Kowalski", "msgCount": 3, "lastMsgDate": "2021-05-01 12:00:00"
}
const room2 = {
    "id": 2, "name": "Adam", "surname": "Nowak", "msgCount": 1, "lastMsgDate": "2022-07-01 12:00:00"
}
const room3 = {
    "id": 3, "name": "Piotr", "surname": "Kowalski", "msgCount": 1, "lastMsgDate": "2021-05-01 12:00:00"
}

const ChatRoomsScreen = ({navigation}) => {
    const loadChatRooms = () => {
        return [room1, room2, room3]
    };

    return (<SafeAreaView>
        <View>
            <FlatList
                data={loadChatRooms()}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={() => <Divider/>}
                renderItem={({item}) => (<TouchableOpacity
                    // onPress={() => navigation.navigate('Room', {thread: item})}
                >
                    <List.Item
                        title={`${item.name} ${item.surname}`}
                        description={formatDistance(new Date(item.lastMsgDate), new Date(), {
                            addSuffix: true, locale: pl
                        })}
                        titleNumberOfLines={1}
                        descriptionNumberOfLines={1}
                    />
                </TouchableOpacity>)}
            />
        </View>
    </SafeAreaView>);
};

export default ChatRoomsScreen;
