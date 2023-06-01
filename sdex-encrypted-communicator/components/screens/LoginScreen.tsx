import * as React from "react";
import { Alert,KeyboardAvoidingView,SafeAreaView,View } from "react-native";
import { Appbar,Button,TextInput } from "react-native-paper";
import { GENERIC_OKAY_DISMISS_BUTTON } from "../Buttons";
import { useAuthStore } from "../Contexts";
import logger from "../Logger";
import { GENERIC_AUTHORIZATION_ERROR_MSG } from "../Messages";
import { getSecure } from "../storage/SecureStoreMiddlewares";
import styles from "../Styles";
import { LoginScreenPropsType } from "../Types";

function LoginScreen({ navigation }: LoginScreenPropsType) {
  const [userInputPIN, setUserInputPIN] = React.useState("");
  const [userActualPIN, setUserActualPIN] = React.useState("");
  const signIn = useAuthStore((state) => state.signIn);

  React.useEffect(() => {
    const fetchActualPIN = async (): Promise<void> => {
      const actualPin = await getSecure("userPIN");
      if (actualPin !== null) {
        logger.info("PIN fetched from secure storage.");
        setUserActualPIN(actualPin.toString());
      } else {
        logger.info("PIN missing in secure storage.");
      }
    };
    fetchActualPIN();
  }, []);

  const handleSignIn = () => {
    logger.debug("Verifying user PIN.");
    if (userActualPIN === "") {
      Alert.alert(GENERIC_AUTHORIZATION_ERROR_MSG, "Brak PINu, zarejestruj się", [
        GENERIC_OKAY_DISMISS_BUTTON,
      ]);
      return;
    }
    if (userInputPIN.trim().length >= 4 && userInputPIN.trim().length <= 8) {
      if (userInputPIN.trim() === userActualPIN) {
        logger.info("PIN verified, signing in.");
        signIn();
      } else {
        logger.info("PIN verified as incorrect.");
        Alert.alert(GENERIC_AUTHORIZATION_ERROR_MSG, "PIN jest niepoprawny", [
          GENERIC_OKAY_DISMISS_BUTTON,
        ]);
      }
    } else {
      logger.debug("PIN length incorrect. Skipped secure storage verification.");
      Alert.alert(
        GENERIC_AUTHORIZATION_ERROR_MSG,
        "Podaj PIN aby się zalogować (4-8 cyfr).",
        [GENERIC_OKAY_DISMISS_BUTTON],
      );
    }
  };

  return (
    <SafeAreaView className="flex flex-1 flex-col">
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content
          title="Logowanie"
          titleStyle={styles.appBarTitle}
          className="ml-11"
        />
      </Appbar.Header>
      <View className="my-auto items-center justify-center">
        <TextInput
          keyboardType="numeric"
          mode="outlined"
          style={styles.textInputPin}
          secureTextEntry
          autoFocus
          maxLength={8}
          placeholder="Wprowadź PIN"
          value={userInputPIN}
          onChangeText={(value) => {
            setUserInputPIN(value);
          }}
        />
        <Button mode="contained" className="my-7 w-40" onPress={handleSignIn}>
          Zaloguj
        </Button>
      </View>
      <KeyboardAvoidingView className="mb-2 mt-auto">
        <Button
          mode="text"
          className="mt-7 align-bottom"
          onPress={() => navigation.navigate("SignUp")}
        >
          Nie masz konta? Załóż je {">"}
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;
