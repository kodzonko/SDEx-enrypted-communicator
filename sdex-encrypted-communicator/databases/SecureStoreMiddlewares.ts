import * as SecureStore from "expo-secure-store";

export const saveSecure = async (key: string, value: object): Promise<void> => {
  const valueStringified = JSON.stringify(value);
  await SecureStore.setItemAsync(key, valueStringified).catch((error) => {
    console.error(error);
  });
};

export const getSecure = async (key: string): Promise<object | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value !== null ? JSON.parse(value) : value;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteSecure = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key).catch((error) => {
    console.error(error);
  });
};
