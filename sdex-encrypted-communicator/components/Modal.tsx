import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const Modal = ({ setVisible }: any) => {
  const closeModal = () => setVisible(false);
  const [groupName, setGroupName] = useState("");

  const handleCreateRoom = () => {
    closeModal();
  };
  return (
    <View>
      <Text>Enter your Group name</Text>
      <TextInput
        placeholder="Group name"
        onChangeText={(value) => setGroupName(value)}
      />
      <View>
        <Pressable onPress={handleCreateRoom}>
          <Text>CREATE</Text>
        </Pressable>
        <Pressable onPress={closeModal}>
          <Text>CANCEL</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Modal;
