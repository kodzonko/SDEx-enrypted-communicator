import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import Toast from "react-native-root-toast";
import { useQrScannedStore } from "../../contexts/QrScannedData";
import logger from "../../Logger";
import styles, { theme } from "../../Styles";

export default function QrScanner() {
    const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
    const [scanned, setScanned] = React.useState<boolean>(false);

    const setPublicKey = useQrScannedStore((state) => state.setPublicKey);

    const router = useRouter();

    React.useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === "granted");
        })();
    }, []);

    const handleBarCodeScanned = (scan: BarCodeScannerResult) => {
        logger.info("[QrScanner.handleBarCodeScanned] QR code scanned successfully.");
        logger.debug(`[QrScanner.handleBarCodeScanned] QR code data=${JSON.stringify(scan.data)}.`);
        setScanned(true);
        setPublicKey(scan.data);
        Toast.show("Kod QR został zapisany.", {
            duration: Toast.durations.SHORT,
        });
    };

    const handleScanAgain = () => {
        setScanned(false);
        setPublicKey("");
    };

    if (hasPermission === null) {
        return <Text>Requesting camera permission...</Text>;
    }

    if (!hasPermission) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View className="flex-1 items-center justify-between bg-black">
            <Text variant="headlineSmall" className="mb-10 mt-20 font-semibold color-white">
                Zeskanuj kod QR znajomego
            </Text>
            <View style={styles.cameraInnerContainer}>
                <BarCodeScanner
                    onBarCodeScanned={handleBarCodeScanned}
                    style={styles.cameraScanner}
                />
            </View>
            {scanned ? (
                <>
                    <Button
                        className="mb-30 w-40 bg-gray-700"
                        mode="contained"
                        onPress={handleScanAgain}
                    >
                        Skanuj ponownie
                    </Button>
                    <IconButton
                        className="mb-20"
                        icon="check-circle"
                        iconColor={theme.colors.primary}
                        size={100}
                        onPress={router.back}
                    />
                </>
            ) : (
                <Button className="mb-56 w-40" mode="contained" onPress={router.back}>
                    Anuluj
                </Button>
            )}
        </View>
    );
}
