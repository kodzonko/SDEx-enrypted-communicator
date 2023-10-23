import * as React from "react";

import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { FlatList, StyleProp, ViewStyle } from "react-native";
import { Dialog, Divider, List, Modal, Portal, Text, TouchableRipple } from "react-native-paper";
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
    const isFocused = useIsFocused();

    React.useEffect(() => {
        if (isFocused && sqlDbSession) {
            (async () => {
                const contactsFromStorage: ContactListItem[] = await getContacts(sqlDbSession);
                logger.info(`Contacts from storage: ${JSON.stringify(contactsFromStorage)}`);
                setContacts(contactsFromStorage);
            })();
        }
    }, [sqlDbSession, isFocused]);

    const goToChatRoom = () => {
        if (contactId) {
            hideModalFunction();
            logger.info(`Going into chat screen with Contact=${contactId}`);
            router.push({
                pathname: "/chat/[contactId]",
                params: { contactId },
            });
            setContactId(undefined);
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
                    <Divider />
                    <TouchableRipple
                        disabled={!contactId}
                        onPress={goToChatRoom}
                        className="flex bg-white opacity-70"
                    >
                        <Text
                            variant="titleLarge"
                            className="mx-auto my-4 font-semibold text-blue-600"
                        >
                            Rozmawiaj
                        </Text>
                    </TouchableRipple>
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
