import * as React from "react";
import { KeyboardAvoidingView, SafeAreaView, View } from "react-native";
import { Appbar, Button, Text, TextInput } from "react-native-paper";

const SignUpScreen = ({ navigation }: any) => {
  const [userPIN, setUserPIN] = React.useState("");
  const [userPINRepeated, setUserPINRepeated] = React.useState("");
  const [keyPair, setKeyPair] = React.useState({
    privateKey: "",
    publicKey: "",
  });
  const _goBack = () => navigation.goBack();

  const handleSignUp = () => {};

  const handleKeysGen = () => {};
  const handleKeysImport = () => {};

  return (
    <SafeAreaView className="flex-1">
      <Appbar.Header>
        <Appbar.BackAction onPress={_goBack} />
        <Appbar.Content title="Rejestracja" />
      </Appbar.Header>

      <View className="my-auto items-center justify-center">
        <Text variant="titleLarge" className="mb-4">
          PIN
        </Text>
        <TextInput
          keyboardType="numeric"
          mode="outlined"
          secureTextEntry={true}
          autoFocus={false}
          maxLength={8}
          placeholder="Utwórz PIN"
          value={userPIN}
          onChangeText={(value) => setUserPIN(value)}
        />
        <TextInput
          className={"mt-3"}
          mode="outlined"
          keyboardType="numeric"
          secureTextEntry={true}
          autoFocus={false}
          maxLength={8}
          placeholder="Powtórz PIN"
          value={userPINRepeated}
          onChangeText={(value) => setUserPINRepeated(value)}
        />
        <KeyboardAvoidingView className="mt-10 items-center">
          <Text variant="titleLarge" className="my-4">
            Klucze szyfrujące
          </Text>
          <View className="flex-row">
            <Button mode="contained" onPress={handleKeysGen} className="mx-2">
              Generuj
            </Button>
            <Button mode="contained" onPress={handleKeysImport} className="mx-2">
              Importuj
            </Button>
          </View>
          <Button mode="contained" className="mt-10 mb-6" onPress={handleSignUp}>
            Zarejestruj
          </Button>
          <Button
            mode="text"
            className="mt-3"
            onPress={() => navigation.navigate("Login")}
          >
            Masz już konto? Zaloguj się
          </Button>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default SignUpScreen;
