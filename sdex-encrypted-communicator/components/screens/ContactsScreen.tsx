import * as React from "react";
import { FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import { Appbar, Divider, List } from "react-native-paper";

import { useContactsStore } from "../Contexts";
import { getContacts } from "../storage/DataHandlers";
import styles from "../Styles";
import { Contact, ContactsStackContactsScreenPropsType } from "../Types";
import { sortAscendingBySurname } from "../utils/Sort";

function ContactsScreen({ navigation }: ContactsStackContactsScreenPropsType) {
  const contacts = useContactsStore((state) => state.contacts);
  const setContacts = useContactsStore((state) => state.setContacts);
  const getContact = useContactsStore((state) => state.getContact);
  const removeContact = useContactsStore((state) => state.removeContact);

  React.useEffect(() => {
    (async () => {
      const contactsFromStorage: Contact[] = await getContacts();
      const contactsSortedBySurname = sortAscendingBySurname(contactsFromStorage);
      setContacts(contactsSortedBySurname);
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Kontakty" titleStyle={styles.appBarTitle} />
        <Appbar.Action
          icon="cog"
          iconColor={styles.appBarIcons.color}
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <List.Item
              className="my-2"
              title={`${item.name} ${item.surname}`}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={(props) => <List.Icon {...props} icon="arrow-right-circle" />}
              titleNumberOfLines={1}
              descriptionNumberOfLines={1}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export default ContactsScreen;
