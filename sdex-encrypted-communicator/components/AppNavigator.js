import * as React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Ionicons} from "@expo/vector-icons";
import SettingsScreen from "./screens/Settings";
import Chat from "./screens/Chat";

const Tab = createBottomTabNavigator();

function AllTabs() {
    return (
        <Tab.Navigator
            tabBarOptions={{showLabel: false}}
            screenOptions={{headerShown: false}}
        >
            <Tab.Screen
                name="Chat"
                component={Chat}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="chatbubbles" color={color} size={size}/>
                    ),
                }}
            />
            <Tab.Screen
                name="settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="people" color={color} size={size}/>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <AllTabs/>
        </NavigationContainer>
    );
}
