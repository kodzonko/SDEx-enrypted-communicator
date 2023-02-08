import React from "react";
import { FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import { Appbar, Divider, List } from "react-native-paper";
import { loadContacts } from "../../utils/localStorage";
import { useNavigation } from "@react-navigation/native";
import { sortAscendingBySurname } from "../../utils/sort";

const ContactsScreen = () => {
  const navigation = useNavigation();

  const contactsFromSorage = loadContacts();
  const sortedContactsBySurname = sortAscendingBySurname(contactsFromSorage);

  return (<SafeAreaView className="flex-1">
    <Appbar.Header>
      <Appbar.Content title="Kontakty" />
      <Appbar.Action size={30} className="mr-2" icon="cog-outline" onPress={() => {
        navigation.navigate("Settings");
      }} />
    </Appbar.Header>
    <FlatList
      data={sortedContactsBySurname}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <Divider />}
      renderItem={({ item }) => (<TouchableOpacity
        // onPress={() => navigation.navigate('Room', {thread: item})}
      >
        <List.Item className="my-2"
                   title={`${item.name} ${item.surname}`}
                   left={(props) => <List.Icon {...props} icon="account" />}
                   right={(props) => <List.Icon {...props} icon="arrow-right-circle" />}
                   titleNumberOfLines={1}
                   descriptionNumberOfLines={1}
        />
      </TouchableOpacity>)}
    />
  </SafeAreaView>);
};

export default ContactsScreen;
