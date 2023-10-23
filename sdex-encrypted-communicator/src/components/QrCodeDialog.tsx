import * as React from "react";
import { Alert, View } from "react-native";
import { Dialog, Portal } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-root-toast";
import logger from "../Logger";
import { GENERIC_WRITE_ERROR_TITLE } from "../Messages";
import { saveImage } from "../storage/FileOps";
import { GENERIC_OKAY_DISMISS_ALERT_BUTTON, GENERIC_SAVE_BUTTON } from "./Buttons";

export default function QrCodeDialog({
    visible,
    hideFunc,
    content,
}: {
    visible: boolean;
    hideFunc: () => void;
    content: string;
}) {
    const qrRef = React.createRef();
    const saveQrImg = async () => {
        logger.info("Saving QR code to a file.");
        const result = await saveImage("qr.png", qrRef.current as string);
        if (!result) {
            Alert.alert(GENERIC_WRITE_ERROR_TITLE, "Nie udało się zapisać QR kodu.", [
                GENERIC_OKAY_DISMISS_ALERT_BUTTON,
            ]);
        } else {
            Toast.show("Kod QR został zapisany.", {
                duration: Toast.durations.SHORT,
            });
        }
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={hideFunc}>
                <Dialog.Title style={{ textAlign: "center" }}>QR z kluczem publicznym</Dialog.Title>
                <Dialog.Content>
                    <View className="items-center">
                        <QRCode
                            value={content}
                            ecl="H"
                            size={300}
                            quietZone={10}
                            getRef={(c): void => {
                                if (c) {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                    c.toDataURL((data: string) => {
                                        qrRef.current = data.replace(/(\r\n|\n|\r)/gm, "");
                                    });
                                }
                            }}
                        />
                        <GENERIC_SAVE_BUTTON saveFunc={saveQrImg} />
                    </View>
                </Dialog.Content>
            </Dialog>
        </Portal>
    );
}
