import * as React from "react";
import { FlatList, SafeAreaView, StyleProp, ViewStyle } from "react-native";
import { Appbar, Divider, FAB, List } from "react-native-paper";

import { useIsFocused } from "@react-navigation/native";
import { Link } from "expo-router";

import { useSqlDbSessionStore } from "../../../contexts/DbSession";
import logger from "../../../Logger";
import { getContacts } from "../../../storage/DataHandlers";
import styles from "../../../Styles";
import { ContactListItem } from "../../../Types";

export default function Contacts() {
  const [contacts, setContacts] = React.useState<ContactListItem[]>([]);

  const isFocused = useIsFocused();
  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);

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
    if (isFocused && sqlDbSession) {
      (async () => {
        const contactsFromStorage: ContactListItem[] = await getContacts(sqlDbSession);
        logger.info(`Contacts from storage: ${JSON.stringify(contactsFromStorage)}`);
        setContacts(contactsFromStorage);
      })();
    }
  }, [sqlDbSession, isFocused]);

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
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={divider}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/contact/[contactId]",
              params: { contactId: item.id },
            }}
            asChild
          >
            <List.Item
              className="my-2"
              title={`${item.name} ${item.surname}`}
              left={leftIcon}
              right={rightIcon}
              titleNumberOfLines={1}
            />
          </Link>
        )}
      />
      <Link
        href={{
          pathname: "/contact/[contactId]",
          params: { contactId: -1 },
        }}
        asChild
      >
        <FAB icon="plus" style={styles.fab} />
      </Link>
    </SafeAreaView>
  );
}
