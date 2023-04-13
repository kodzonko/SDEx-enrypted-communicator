import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveValue = async (key: string, value: object): Promise<void> => {
  const valueStringified = JSON.stringify(value);
  await AsyncStorage.setItem(key, valueStringified).catch((error) => {
    console.error(error);
  });
};

export const getValue = async (key: string): Promise<any | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null ? JSON.parse(value) : value;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const removeValue = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key).catch((error) => {
    console.error(error);
  });
};
