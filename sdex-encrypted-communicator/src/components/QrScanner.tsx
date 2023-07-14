import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
import * as React from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export default function QRScanner() {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [scanned, setScanned] = React.useState<boolean>(false);
  const [scannedData, setScannedData] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: BarCodeScannerResult) => {
    setScanned(true);
    setScannedData(data);
    Alert.alert(`Scanned QR code: ${data}`);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData("");
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View className="flex-1 items-center justify-center">
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ ...StyleSheet.absoluteFillObject, flex: 1 }}
      />
      {scanned && (
        <View className="absolute rounded bg-black bg-opacity-50 p-4">
          <Text className="mb-2 text-lg text-white">Scanned QR code: {scannedData}</Text>
          <Button title="Scan Again" onPress={handleScanAgain} />
        </View>
      )}
    </View>
  );
}
