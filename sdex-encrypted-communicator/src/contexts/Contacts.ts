import { create } from "zustand";
import { Contact, ContactsStoreContactAction, ContactsStoreContactList } from "../Types";

export const useContactsStore = create<ContactsStoreContactList & ContactsStoreContactAction>(
    (set, get) => ({
        contacts: [],
        addContact: (value) => set((state) => ({ contacts: [...state.contacts, value] })),
        setContacts: (values) => set(() => ({ contacts: values })),
        getContact: (id): Contact | undefined =>
            get().contacts.find((contact) => contact.id === id),
        updateContact: (id: number, value: Contact) => {
            set((state) => {
                const index = state.contacts.findIndex((contact) => contact.id === id);
                /* eslint-disable-next-line no-param-reassign */
                state.contacts[index] = value;
                return { contacts: state.contacts };
            });
        },
        removeContact: (id) => {
            set((state) => ({
                contacts: state.contacts.filter((contact) => contact.id !== id),
            }));
        },
    }),
);
