import React from "react";
import {SafeAreaView, Text, View} from "react-native";

function SettingsScreen() {
    return (<SafeAreaView className="flex-1 justify-center">
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <Text>Settings screen</Text>
        </View>
    </SafeAreaView>);
}

export default SettingsScreen;
