import React, { useEffect, useLayoutEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Modal from "../Modal";
import server from "../../utils/server";
import { styles } from "../../utils/styles";
import Config from "react-native-config";

const Chat = () => {
  const [visible, setVisible] = useState(false);
  const [rooms, setRooms] = useState([]);

  useLayoutEffect(() => {
    function fetchGroups() {
      fetch(Config.API_URL)
        .then((res) => res.json())
        .then((data) => setRooms(data))
        .catch((err) => console.error(err));
    }

    fetchGroups();
  }, []);

  useEffect(() => {
    server.on("roomsList", (rooms) => {
      setRooms(rooms);
    });
  }, [server]);

  const handleCreateGroup = () => setVisible(true);

  return (
    <SafeAreaView style={styles.chatscreen}>
      <View style={styles.chattopContainer}>
        <View style={styles.chatheader}>
          <Text style={styles.chatheading}>Chats</Text>
          <Pressable onPress={handleCreateGroup}>
            <Feather name="edit" size={24} color="green" />
          </Pressable>
        </View>
      </View>

      <View style={styles.chatlistContainer}>
        {rooms.length > 0 ? (
          {
            /* <FlatList
            data={rooms}
            renderItem={({ item }) => <ChatComponent item={item} />}
            keyExtractor={(item) => item.id}
          /> */
          }
        ) : (
          <View style={styles.chatemptyContainer}>
            {/* <>
              <Text style={styles.chatemptyText}>Brak prowadzonych rozmów</Text>
              <Text>Zeskanuj kod QR rozmówcy, aby rozpocząć czat</Text>
            </> */}
          </View>
        )}
      </View>
      {visible ? <Modal setVisible={setVisible} /> : ""}
    </SafeAreaView>
  );
};

export default Chat;
