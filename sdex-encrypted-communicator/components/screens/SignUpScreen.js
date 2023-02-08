import * as React from "react";
import { KeyboardAvoidingView, SafeAreaView, View } from "react-native";
import { Appbar, Button, TextInput } from "react-native-paper";

const SignUpScreen = ({ navigation }) => {
  const [userPIN, setUserPIN] = React.useState("");
  const [userPINRepeated, setUserPINRepeated] = React.useState("");
  const [keyPair, setKeyPair] = React.useState({
    privateKey: "",
    publicKey: ""
  });
  const _goBack = () => navigation.goBack();

  const handleSignUp = () => {
  };

  return (<SafeAreaView className="flex-1">
    <Appbar.Header>
      <Appbar.BackAction onPress={_goBack} />
      <Appbar.Content title="Tworzenie konta" />
      <Appbar.Action size={30} className="mr-2" icon="check"
                     disabled={(!(userPIN.trim() && userPINRepeated.trim() && keyPair.publicKey.trim() && keyPair.privateKey.trim()))}
                     onPress={() => {
                       handleSignUp();
                     }} />
    </Appbar.Header>

    <View className="items-center justify-center my-auto">
      <TextInput
        keyboardType="numeric"
        secureTextEntry={true}
        autoFocus={false}
        minlength={4}
        maxLength={8}
        placeholder="Utwórz PIN"
        onChangeText={(value) => setUserPIN(value)}
      />
      <TextInput className={"mt-3"}
                 keyboardType="numeric"
                 secureTextEntry={true}
                 autoFocus={false}
                 minlength={4}
                 maxLength={8}
                 placeholder="Powtórz PIN"
                 onChangeText={(value) => setUserPIN(value)}
      />
      <KeyboardAvoidingView className={"mt-10"}>
        <Button mode="outlined" onPress={handleSignUp}>
          Wygeneruj parę kluczy
        </Button>
        <Button mode="outlined" className="mt-3" onPress={handleSignUp}>
          Importuj klucze
        </Button>
        <Button mode="text" className="mt-3" onPress={() => navigation.navigate("Login")}>
          Masz już konto? Zaloguj się
        </Button></KeyboardAvoidingView>
    </View>
  </SafeAreaView>);
};

export default SignUpScreen;