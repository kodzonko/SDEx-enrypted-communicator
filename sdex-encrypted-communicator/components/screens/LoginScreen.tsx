import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, View } from "react-native";
import { Appbar, Button, TextInput } from "react-native-paper";
import { getSecure } from "../../utils/localStorage";
import { useAuthStore } from "../AuthContext";

const LoginScreen = ({ navigation }: any) => {
  const [userInputPIN, setUserInputPIN] = React.useState("");
  const [userActualPIN, setUserActualPIN] = React.useState("");
  const signIn = useAuthStore((state) => state.signIn);

  React.useEffect(() => {
    const getActualPIN = async () => {
      await getSecure("userPIN")
        .then((value) => (value ? setUserActualPIN(value) : null))
        .catch((error) => {
          Alert.alert(
            "Błąd autoryzacji",
            `Nie udało się pobrać PINu z bazy danych: ${error.message()}`,
            [
              {
                text: "Okej",
                onPress: () => {},
              },
            ],
          );

          if (!userActualPIN) {
            Alert.alert(
              "Błąd autoryzacji",
              "PIN nie istnieje w bazie, zarejestruj się",
              [
                {
                  text: "Okej",
                  onPress: () => {},
                },
              ],
            );
          }
        });
    };
  }, []);

  const handleSignIn = () => {
    if (userInputPIN.trim().length >= 4 && userInputPIN.trim().length <= 8) {
      if (userInputPIN.trim() === userActualPIN) {
        signIn();
      } else {
        Alert.alert("Błąd autoryzacji", "PIN jest niepoprawny", [
          {
            text: "Okej",
            onPress: () => {},
          },
        ]);
      }
    } else {
      Alert.alert("Błąd autoryzacji", "Podaj PIN aby się zalogować (4-8 cyfr).", [
        {
          text: "Okej",
          onPress: () => {},
        },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header>
        <Appbar.Content title="Logowanie" />
      </Appbar.Header>
      <View className="my-auto items-center justify-center">
        <TextInput
          keyboardType="numeric"
          mode="outlined"
          secureTextEntry={true}
          autoFocus={true}
          maxLength={8}
          placeholder="Wprowadź PIN"
          value={userInputPIN}
          onChangeText={(value) => {
            setUserInputPIN(value);
          }}
        />
        <Button mode="contained" className="mt-3" onPress={handleSignIn}>
          Zaloguj
        </Button>
        <KeyboardAvoidingView>
          <Button
            mode="text"
            className="mt-3 align-bottom"
            onPress={() => navigation.navigate("SignUp")}
          >
            Nie masz konta? Załóż je.
          </Button>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};
export default LoginScreen;
