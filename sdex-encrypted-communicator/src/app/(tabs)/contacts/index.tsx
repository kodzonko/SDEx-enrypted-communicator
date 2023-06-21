import * as React from "react";
import { FlatList, SafeAreaView, StyleProp, ViewStyle } from "react-native";
import { Appbar, Divider, FAB, List } from "react-native-paper";

import { useIsFocused } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import AddContactModal from "../../../components/AddContactModal";
import { useSqlDbSessionStore } from "../../../contexts/DbSession";
import { getContacts } from "../../../storage/DataHandlers";
import styles from "../../../Styles";
import { ContactListItem } from "../../../Types";

export default function Contacts() {
  // const contacts = useContactsStore((state) => state.contacts);
  // const setContacts = useContactsStore((state) => state.setContacts);
  // const getContact = useContactsStore((state) => state.getContact);
  // const removeContact = useContactsStore((state) => state.removeContact);
  const [contacts, setContacts] = React.useState<ContactListItem[]>([]);
  const [contactId, setContactId] = React.useState<number | undefined>(undefined);

  const isFocused = useIsFocused();

  const [addContactModalVisible, setAddContactModalVisible] = React.useState(false);
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);
  const router = useRouter();

  const divider = () => <Divider />;
  const leftIcon = (props: { color: string; style?: StyleProp<ViewStyle> }) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <List.Icon {...props} icon="account" />
  );
  const rightIcon = (props: { color: string; style?: StyleProp<ViewStyle> }) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <List.Icon {...props} icon="arrow-right-circle" />
  );

  React.useEffect(() => {
    if (isFocused) {
      (async () => {
        const contactsFromStorage: ContactListItem[] = await getContacts(sqlDbSession);
        setContacts(contactsFromStorage);
      })();
    }
  }, [sqlDbSession, isFocused]);

  const showModal = () => setAddContactModalVisible(true);
  const hideModal = () => setAddContactModalVisible(false);

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="Kontakty" titleStyle={styles.appBarTitle} />
        <Link href="/settings" asChild>
          <Appbar.Action icon="cog" iconColor={styles.appBarIcons.color} />
        </Link>
      </Appbar.Header>
      <FlatList
        data={contacts}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        ItemSeparatorComponent={divider}
        renderItem={({ item }) => (
          <List.Item
            className="my-2"
            title={`${item.name} ${item.surname}`}
            left={leftIcon}
            right={rightIcon}
            titleNumberOfLines={1}
          />
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={showModal} />
      <AddContactModal visible={addContactModalVisible} hideModalFunction={hideModal} />
    </SafeAreaView>
  );
}
