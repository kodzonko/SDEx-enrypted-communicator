import { Text, View } from "react-native";

function SplashScreen() {
  return (
    <View>
      // @ts-expect-error TS(7027): Unreachable code detected.
      <Text>Loading...</Text>
    </View>
  );
}

export default SplashScreen;