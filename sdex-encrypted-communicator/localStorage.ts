import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { GENERIC_LOCAL_STORAGE_ERROR } from "./errorMessages";
import { IChatRoomListItem, IContact } from "./types";

export const saveSecure = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value).catch((error) => {
    Alert.alert(
      GENERIC_LOCAL_STORAGE_ERROR,
      `Nie udało się zapisać "${key}": "${value}" w bazie danych.`,
      [
        {
          text: "Okej",
          onPress: () => {},
        },
      ],
    );
  });
};

export const getSecure = async (key: string): Promise<string | null> => {
  let output = null;
  await SecureStore.getItemAsync(key)
    .then((value) => {
      if (value === null) {
        Alert.alert("Nie ma żadnej wartości dla tego klucza.", "", [
          {
            text: "Okej",
            onPress: () => {},
          },
        ]);
      }
      output = value;
    })
    .catch((error) => {
      Alert.alert(
        GENERIC_LOCAL_STORAGE_ERROR,
        `Nie udało się pobrać wartości dla klucza: ${key}.`,
        [
          {
            text: "Okej",
            onPress: () => {},
          },
        ],
      );
    });
  return output;
};

export const deleteSecure = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key).catch((error) => {
    Alert.alert(
      GENERIC_LOCAL_STORAGE_ERROR,
      "Nie udało się usunąć wartości dla tego klucza.",
    );
  });
};

export const saveInsecure = async (key: string, value: object): Promise<void> => {
  try {
    const stringifiedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringifiedValue);
  } catch (error) {
    Alert.alert(
      GENERIC_LOCAL_STORAGE_ERROR,
      `Para wartości "${key}": "${value}" nie mogła zostać zapisana.`,
      [
        {
          text: "Okej",
          onPress: () => {},
        },
      ],
    );
  }
};

export const getInsecure = async (query: any) => {
  db.findOne(query);
};

export const updateInsecure = async (oldValue: any, newValue: any) => {
  db.update(oldValue, newValue);
};

export const removeInsecure = async (query: any) => {
  db.remove({ _id: "id2" });
};

export const loadContacts = (): IContact[] => {
  return [
    {
      id: 1,
      name: "Merrielle",
      surname: "Dulson",
      publicKey: "c65c9bc1d1131ba52e48982fb05a39f5c0ec02dd1f077048470e73a258672c04",
    },
    {
      id: 2,
      name: "Carla",
      surname: "Dysert",
      publicKey: "8b58fc0865eb4aa927ab60087593bd52a306469550a7aac248a50e20d7ce5d5c",
    },
    {
      id: 3,
      name: "Crichton",
      surname: "Blamphin",
      publicKey: "83e1caa47a613c7b52fe0c0b70ecd3f16289c449be86eb70050468e2d71d7067",
    },
    {
      id: 4,
      name: "Lindsay",
      surname: "Bonnar",
      publicKey: "f4bb3a9b667898531fe067386df67d4f107c37bfd57525cebb623a0676643dfa",
    },
    {
      id: 5,
      name: "Tammy",
      surname: "MacCracken",
      publicKey: "47c588158df48c8ce02922ec5b046399a40f21f2d3d1ad77bc54ac338905d58c",
    },
    {
      id: 6,
      name: "Ingunna",
      surname: "Hansard",
      publicKey: "d7b794ff241c3e5e35b6928c1d937a3b4c20833ba5afa5e080906727e1eb893c",
    },
    {
      id: 7,
      name: "Giraldo",
      surname: "Linnemann",
      publicKey: "32a23f0d9af353455d053d858933e7070bb8e33071aac9e5f91b56152afe95ca",
    },
    {
      id: 8,
      name: "Garth",
      surname: "Hoovart",
      publicKey: "aede30a8b84ede502aab55400a386aa810dd6ba0fa59e5388d91c1529a51987d",
    },
    {
      id: 9,
      name: "Kari",
      surname: "McBean",
      publicKey: "b17756f663a01848679149e6c0788ef747df7afdb0086cf967d4148cd80d9038",
    },
    {
      id: 10,
      name: "Banky",
      surname: "Kiessel",
      publicKey: "60fefa95f232c28974aaa4f1ff8b64b979ece23d0811a4a68f238787b0026313",
    },
    {
      id: 11,
      name: "Winonah",
      surname: "Pugsley",
      publicKey: "827bd27fe85f54009d33959a1a11504580c061ab51a10a8eb9828fe611d39840",
    },
    {
      id: 12,
      name: "Barth",
      surname: "Mussington",
      publicKey: "e3411085bef32ca3a409052e03ced86a324d41694c6c0edaf42b971382bd39d9",
    },
    {
      id: 13,
      name: "Brina",
      surname: "Ruddiman",
      publicKey: "b587f262bca6709ab2fa99d830a7fc32efb8e21e4386b4869840e5b5c6dd4e11",
    },
    {
      id: 14,
      name: "Dacy",
      surname: "Schimon",
      publicKey: "453c4a6441f8709c8b3211b8f146d24d41106996be59e0835550349accb4653b",
    },
    {
      id: 15,
      name: "Christal",
      surname: "Buckoke",
      publicKey: "a75d2e4f9ccb7d740144960ba9d3ac20a4f172d2af89b665c93c9c4cfd8fbd84",
    },
  ];
};

export const loadChatRooms = (): IChatRoomListItem[] => {
  return [
    {
      id: 1,
      name: "Dorene",
      surname: "Seleway",
      lastMsgDate: "2023-01-25T16:57:37Z",
      unreadMsgCount: 9,
    },
    {
      id: 2,
      name: "Addia",
      surname: "Addison",
      lastMsgDate: "2022-12-15T22:15:32Z",
      unreadMsgCount: 0,
    },
    {
      id: 3,
      name: "Jarrad",
      surname: "Holdey",
      lastMsgDate: "2022-12-11T19:24:40Z",
      unreadMsgCount: 6,
    },
    {
      id: 4,
      name: "Levey",
      surname: "Coles",
      lastMsgDate: "2023-01-01T15:34:10Z",
      unreadMsgCount: 9,
    },
    {
      id: 5,
      name: "Bamby",
      surname: "MacCostye",
      lastMsgDate: "2022-11-25T23:49:25Z",
      unreadMsgCount: 7,
    },
    {
      id: 6,
      name: "Noell",
      surname: "Pote",
      lastMsgDate: "2023-01-06T06:14:55Z",
      unreadMsgCount: 11,
    },
    {
      id: 7,
      name: "Zonnya",
      surname: "Patrie",
      lastMsgDate: "2023-01-29T19:50:55Z",
      unreadMsgCount: 1,
    },
    {
      id: 8,
      name: "Mathilda",
      surname: "Whymark",
      lastMsgDate: "2023-02-04T11:12:22Z",
      unreadMsgCount: 7,
    },
    {
      id: 9,
      name: "Orelle",
      surname: "Van Arsdale",
      lastMsgDate: "2022-12-31T10:03:12Z",
      unreadMsgCount: 5,
    },
    {
      id: 10,
      name: "Blaine",
      surname: "Bonick",
      lastMsgDate: "2023-01-02T12:31:27Z",
      unreadMsgCount: 1,
    },
    {
      id: 11,
      name: "Sharity",
      surname: "Idle",
      lastMsgDate: "2023-01-11T12:07:12Z",
      unreadMsgCount: 9,
    },
    {
      id: 12,
      name: "Heather",
      surname: "Marini",
      lastMsgDate: "2022-10-08T21:01:51Z",
      unreadMsgCount: 8,
    },
    {
      id: 13,
      name: "Cherin",
      surname: "Keward",
      lastMsgDate: "2022-10-24T22:40:32Z",
      unreadMsgCount: 0,
    },
    {
      id: 14,
      name: "Babbette",
      surname: "McAusland",
      lastMsgDate: "2022-11-02T07:37:02Z",
      unreadMsgCount: 1,
    },
    {
      id: 15,
      name: "Charlot",
      surname: "Huckett",
      lastMsgDate: "2022-12-14T22:29:24Z",
      unreadMsgCount: 4,
    },
    {
      id: 16,
      name: "Lenci",
      surname: "Le Brom",
      lastMsgDate: "2022-12-07T11:58:10Z",
      unreadMsgCount: 11,
    },
    {
      id: 17,
      name: "Trip",
      surname: "Penwarden",
      lastMsgDate: "2022-12-01T14:13:38Z",
      unreadMsgCount: 0,
    },
    {
      id: 18,
      name: "Zach",
      surname: "Laherty",
      lastMsgDate: "2023-02-05T23:41:16Z",
      unreadMsgCount: 5,
    },
    {
      id: 19,
      name: "Emanuel",
      surname: "Mothersole",
      lastMsgDate: "2022-12-23T01:52:38Z",
      unreadMsgCount: 4,
    },
    {
      id: 20,
      name: "Emanuele",
      surname: "Quinnelly",
      lastMsgDate: "2022-10-22T22:59:56Z",
      unreadMsgCount: 3,
    },
    {
      id: 21,
      name: "Guinna",
      surname: "Whyteman",
      lastMsgDate: "2023-01-10T14:05:36Z",
      unreadMsgCount: 7,
    },
    {
      id: 22,
      name: "Iris",
      surname: "Willbraham",
      lastMsgDate: "2022-12-22T11:24:39Z",
      unreadMsgCount: 6,
    },
    {
      id: 23,
      name: "Christos",
      surname: "Beardow",
      lastMsgDate: "2022-11-01T22:14:27Z",
      unreadMsgCount: 5,
    },
    {
      id: 24,
      name: "Marlyn",
      surname: "D'Antuoni",
      lastMsgDate: "2022-10-16T20:56:54Z",
      unreadMsgCount: 2,
    },
    {
      id: 25,
      name: "Sondra",
      surname: "Chorlton",
      lastMsgDate: "2022-10-12T01:59:00Z",
      unreadMsgCount: 9,
    },
    {
      id: 26,
      name: "Giulietta",
      surname: "Smythin",
      lastMsgDate: "2022-11-09T17:03:13Z",
      unreadMsgCount: 5,
    },
    {
      id: 27,
      name: "Darcy",
      surname: "Gonoude",
      lastMsgDate: "2022-12-12T16:23:51Z",
      unreadMsgCount: 1,
    },
    {
      id: 28,
      name: "Inna",
      surname: "Siemens",
      lastMsgDate: "2022-11-18T19:31:19Z",
      unreadMsgCount: 6,
    },
    {
      id: 29,
      name: "Noll",
      surname: "Moodycliffe",
      lastMsgDate: "2022-11-11T12:02:17Z",
      unreadMsgCount: 0,
    },
    {
      id: 30,
      name: "Hartley",
      surname: "Sanpher",
      lastMsgDate: "2022-12-07T09:12:37Z",
      unreadMsgCount: 1,
    },
    {
      id: 31,
      name: "Noell",
      surname: "Bedson",
      lastMsgDate: "2023-02-02T10:32:38Z",
      unreadMsgCount: 8,
    },
    {
      id: 32,
      name: "Foster",
      surname: "Pepler",
      lastMsgDate: "2023-01-10T19:43:06Z",
      unreadMsgCount: 4,
    },
    {
      id: 33,
      name: "Saree",
      surname: "Peplay",
      lastMsgDate: "2022-11-01T16:15:50Z",
      unreadMsgCount: 1,
    },
    {
      id: 34,
      name: "Aeriell",
      surname: "Sherbrook",
      lastMsgDate: "2022-10-07T07:45:06Z",
      unreadMsgCount: 4,
    },
    {
      id: 35,
      name: "Gilda",
      surname: "McAlinion",
      lastMsgDate: "2022-12-31T07:10:27Z",
      unreadMsgCount: 8,
    },
    {
      id: 36,
      name: "Roanna",
      surname: "Dashkov",
      lastMsgDate: "2022-10-06T13:27:01Z",
      unreadMsgCount: 5,
    },
    {
      id: 37,
      name: "Justus",
      surname: "Frickey",
      lastMsgDate: "2022-11-23T17:46:00Z",
      unreadMsgCount: 8,
    },
    {
      id: 38,
      name: "Artemus",
      surname: "Hurcombe",
      lastMsgDate: "2022-10-01T16:54:00Z",
      unreadMsgCount: 11,
    },
    {
      id: 39,
      name: "Leonidas",
      surname: "Dowdall",
      lastMsgDate: "2022-12-15T19:18:37Z",
      unreadMsgCount: 7,
    },
    {
      id: 40,
      name: "Claudine",
      surname: "Parell",
      lastMsgDate: "2022-11-05T02:32:41Z",
      unreadMsgCount: 4,
    },
  ];
};

export const getUnreadCount = () => {
  return null;
};
