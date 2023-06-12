import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ContactsScreen from "../screens/ContactsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { ContactsStackNavigationParamList } from "../Types";

const ContactsStack = createNativeStackNavigator<ContactsStackNavigationParamList>();

function ContactsStackNavigator() {
  return (
    <ContactsStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={"Contacts"}
    >
      <ContactsStack.Screen name="Contacts" component={ContactsScreen} />
      <ContactsStack.Screen name="Settings" component={SettingsScreen} />
    </ContactsStack.Navigator>
  );
}

export default ContactsStackNavigator;
