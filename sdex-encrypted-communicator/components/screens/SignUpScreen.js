import * as React from "react";
import {KeyboardAvoidingView, SafeAreaView, View} from "react-native";
import {Appbar, Button, TextInput} from 'react-native-paper';

const SignUpScreen = ({navigation}) => {
    const _goBack = () => navigation.goBack();

    const handleSignUp = () => {
    };

    return (<SafeAreaView className="flex-1">
        <Appbar.Header>
            <Appbar.BackAction onPress={_goBack}/>
            <Appbar.Content title="Tworzenie konta"/>
        </Appbar.Header>

        <View className="items-center justify-center my-auto">
            <TextInput
                keyboardType="numeric"
                secureTextEntry={true}
                autoFocus={true}
                minlength={4}
                maxLength={8}
                placeholder="Utwórz PIN"
                onChangeText={(value) => setUserPIN(value)}
            />
            <TextInput
                keyboardType="numeric"
                secureTextEntry={true}
                autoFocus={true}
                minlength={4}
                maxLength={8}
                placeholder="Powtórz PIN"
                onChangeText={(value) => setUserPIN(value)}
            />
            <KeyboardAvoidingView>
                <Button mode="outlined" className="mt-3" onPress={handleSignUp}>
                    Wygeneruj parę kluczy
                </Button>
                <Button mode="text" className="mt-3" onPress={() => navigation.navigate("Login")}>
                    Masz już konto? Zaloguj się
                </Button></KeyboardAvoidingView>
        </View>
    </SafeAreaView>);
}

export default SignUpScreen;