import * as React from "react";
import {Alert, KeyboardAvoidingView, SafeAreaView, View} from "react-native";
import {Appbar, Button, TextInput} from 'react-native-paper';
import AuthContext from "../AuthContext";

const LoginScreen = ({navigation}) => {
    const [userPIN, setUserPIN] = React.useState("");

    const signIn = React.useContext(AuthContext);

    const handleSignIn = () => {
        if (userPIN.trim()) {
            return True
        } else {
            Alert.alert("Podaj PIN aby się zalogować");
        }
    };

    return (<SafeAreaView className="flex-1">
        <Appbar.Header>
            <Appbar.Content title="Logowanie"/>
        </Appbar.Header>
        <View className="items-center justify-center my-auto">
            <TextInput
                keyboardType="numeric"
                secureTextEntry={true}
                autoFocus={true}
                minLength={4}
                maxLength={8}
                placeholder="Wprowadź PIN"
                onChangeText={(value) => setUserPIN(value)}
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
