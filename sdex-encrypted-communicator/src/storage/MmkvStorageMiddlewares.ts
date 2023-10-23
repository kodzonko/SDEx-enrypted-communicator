import { MMKV } from "react-native-mmkv";

export const mmkvStorage = new MMKV({
    id: "global-app-storage",
    encryptionKey: "LzNQ0CIKlQxng9QWuRrbbDFHXDQvjaBQ",
});
