import * as React from "react";
import { Alert, KeyboardAvoidingView, SafeAreaView, View } from "react-native";
import { Appbar, Button, TextInput } from "react-native-paper";
import AuthContext from "../AuthContext";
import { getSecure } from "../../utils/localStorage";

const LoginScreen = ({ navigation }) => {
  const [userInputPIN, setUserInputPIN] = React.useState("");
  const [userActualPIN, setUserActualPIN] = React.useState("");
  const { isSignedIn, setIsSignedIn } = React.useContext(AuthContext);

  React.useEffect(() => {
    const getActualPIN = async () => {
      try {
        const fetchedPIN = await getSecure("userPIN");
        if (!fetchedPIN) {
          Alert.alert("Błąd autoryzacji", "PIN nie istnieje w bazie, zarejestruj się", [
            {
              text: "Okej", onPress: () => {
              }
            }
          ]);
        } else {
          setUserActualPIN(fetchedPIN);
        }
      } catch (error) {
        Alert.alert("Bład autoryzacji", "Nie udało się pobrać PINu z bazy danych. Autoryzacja niemożliwa.", [
          {
            text: "Okej", onPress: () => {
            }
          }
        ]);
      }
    };

  }, []);

  const handleSignIn = () => {
    if (userInputPIN.trim().length >= 4 && userInputPIN.trim().length <= 8) {
      if (userInputPIN.trim() === userActualPIN) {
        setIsSignedIn(true);
      } else {
        Alert.alert("Bład autoryzacji", "PIN jest niepoprawny", [
          {
            text: "Okej", onPress: () => {
            }
          }
        ]);
      }
    } else {
      Alert.alert("Bład autoryzacji", "Podaj PIN aby się zalogować (4-8 cyfr).", [
        {
          text: "Okej", onPress: () => {
          }
        }
      ]);
    }
  };

  return (<SafeAreaView className="flex-1">
    <Appbar.Header>
      <Appbar.Content title="Logowanie" />
    </Appbar.Header>
    <View className="items-center justify-center my-auto">
      <TextInput
        keyboardType="numeric"
        secureTextEntry={true}
        autoFocus={true}
        minLength={4}
        maxLength={8}
        placeholder="Wprowadź PIN"
        onChangeText={(value) => {
          setUserInputPIN(value);
        }}
      />
      <Button mode="outlined" className="mt-3" onPress={handleSignIn}>
        Zaloguj
      </Button>
      <KeyboardAvoidingView>
        <Button mode="text" className="align-bottom mt-3" onPress={() => navigation.navigate("SignUp")}>
          Nie masz jeszcze konta? Załóż je
        </Button>
      </KeyboardAvoidingView>
    </View>
  </SafeAreaView>);
};

export default LoginScreen;
