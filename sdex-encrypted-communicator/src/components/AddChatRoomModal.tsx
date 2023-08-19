import * as React from "react";

import { useRouter } from "expo-router";
import { StyleProp, ViewStyle } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import {
  Button,
  Dialog,
  Divider,
  List,
  Modal,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { useSqlDbSessionStore } from "../contexts/DbSession";
import logger from "../Logger";
import { getContacts } from "../storage/DataHandlers";
import { ContactListItem } from "../Types";
import { GENERIC_OKAY_DISMISS_BUTTON } from "./Buttons";

export default function AddChatRoomModal({
  visible,
  hideFunction: hideModalFunction,
}: {
  visible: boolean;
  hideFunction: () => void;
}) {
  const [contactId, setContactId] = React.useState<number | undefined>(undefined);
  const [contacts, setContacts] = React.useState<ContactListItem[]>([]);

  const sqlDbSession = useSqlDbSessionStore((state) => state.sqlDbSession);

  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const contactsFromStorage: ContactListItem[] = await getContacts(sqlDbSession);
      setContacts(contactsFromStorage);
    })();
  }, [sqlDbSession, setContacts]);

  const goToChatRoom = () => {
    if (contactId) {
      hideModalFunction();
      logger.info(`Going into chat screen with Contact=${contactId}`);
      router.push({
        pathname: "/chat/[contactId]",
        params: { contactId },
      });
    } else {
      logger.error(`Ignoring button press. contactId=${JSON.stringify(contactId)}`);
    }
  };

  const divider = () => <Divider />;
  const leftIcon = (props: { color: string; style?: StyleProp<ViewStyle> }) => (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <List.Icon {...props} icon="account" />
  );

  return (
    <Portal>
      {contacts.length > 0 ? (
        <Modal visible={visible} onDismiss={hideModalFunction} dismissable>
          <FlatList
            data={contacts}
            className="flex bg-white opacity-70"
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={divider}
            renderItem={({ item }) => (
              <TouchableRipple>
                <List.Item
                  className="mx-auto my-2 flex"
                  title={`${item.name} ${item.surname}`}
                  left={leftIcon}
                  style={{ rowGap: 0 }}
                  titleNumberOfLines={1}
                  onPress={() => {
                    setContactId(item.id);
                  }}
                />
              </TouchableRipple>
            )}
          />
          <Button onPress={goToChatRoom} className="rounded-none bg-white opacity-70">
            Rozmawiaj
          </Button>
          )
        </Modal>
      ) : (
        <Dialog visible={visible} onDismiss={hideModalFunction}>
          <Dialog.Title style={{ textAlign: "center" }}>Brak kontaktów</Dialog.Title>
          <Dialog.Content className="flex items-center">
            <Text>Aby móc rozmawiać najpierw dodaj kontakt.</Text>
            <GENERIC_OKAY_DISMISS_BUTTON dismissFunc={hideModalFunction} />
          </Dialog.Content>
        </Dialog>
      )}
    </Portal>
  );
}
