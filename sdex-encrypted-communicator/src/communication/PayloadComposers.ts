import { decryptRsa, encryptRsa } from "../crypto/RsaCrypto";
import SdexCrypto from "../crypto/SdexCrypto";
import { Message, TransportedMessage } from "../Types";
import { base64ToBytes, bytesToBase64, messageToTransportedMessage } from "../utils/Converters";

/**
 * Handler preparation of message to send it to the server.
 * Deals with encryption and stripping source message of unnecessary metadata
 * and adds necessary metadata for forwarding purposes (server) and decryption (third party).
 * @param message message object as ingested from database or converted from GiftedChatMessage
 * @param publicKeyFrom sender's RSA public key (for identification)
 * @param publicKeyTo  receiver's public key (for encryption)
 * @param sdexEngine object responsible for encryption, with appropriate context for the task
 * @returns an object (TransportedMessage) ready to emit to server via socket connection
 */
export async function prepareToSend(
    message: Message,
    publicKeyFrom: string,
    publicKeyTo: string,
    sdexEngine: SdexCrypto,
): Promise<TransportedMessage> {
    // Encrypt message (each content field separately) with SDEx and serialize Uint8Array to base64string
    const sdexEncryptedText = bytesToBase64(sdexEngine.encryptMessage(message.text));
    const sdexEncryptedImage = message.image
        ? bytesToBase64(sdexEngine.encryptMessage(message.image))
        : undefined;
    const sdexEncryptedVideo = message.video
        ? bytesToBase64(sdexEngine.encryptMessage(message.video))
        : undefined;
    const sdexEncryptedAudio = message.audio
        ? bytesToBase64(sdexEngine.encryptMessage(message.audio))
        : undefined;

    // Encrypt sdex-encrypted content with receiver's publicKey
    const rsaEncryptedText = await encryptRsa(publicKeyTo, sdexEncryptedText);
    const rsaEncryptedImage = sdexEncryptedImage
        ? await encryptRsa(publicKeyTo, sdexEncryptedImage)
        : undefined;
    const rsaEncryptedVideo = sdexEncryptedVideo
        ? await encryptRsa(publicKeyTo, sdexEncryptedVideo)
        : undefined;
    const rsaEncryptedAudio = sdexEncryptedAudio
        ? await encryptRsa(publicKeyTo, sdexEncryptedAudio)
        : undefined;

    const rsaSdexEncryptedMessage = new Message(
        message.contactIdFrom,
        message.contactIdTo,
        rsaEncryptedText,
        message.createdAt,
        message.unread,
        rsaEncryptedImage,
        rsaEncryptedVideo,
        rsaEncryptedAudio,
        message.id,
    );

    // Convert a message to a TransportedMessage which has metadata needed for server and receiver to process it.
    const transportedMessage = messageToTransportedMessage(
        rsaSdexEncryptedMessage,
        publicKeyFrom,
        publicKeyTo,
    );

    return transportedMessage;
}

/**
 * Handle a message received from server and prepare it to save to database and present to user (i.e. decrypt and parse)
 * @param message A message from server
 * @param sdexEngine object responsible for decryption, with appropriate context for the task
 * @param privateKeyTo first party's private key to facilitate RSA decryption
 * @param contactIdTo receiver's contact id (first party's ID == 0)
 * @param contactIdFrom sender's contact id
 * @returns Message decrypted and parsed into Message object
 */
export async function prepareToIngest(
    message: TransportedMessage,
    sdexEngine: SdexCrypto,
    privateKeyTo: string,
    contactIdFrom: number,
): Promise<Message> {
    // First decrypt RSA (content will still be encrypted with SDEx)
    const rsaDecryptedText = await decryptRsa(privateKeyTo, message.text);
    const rsaDecryptedImage = message.image
        ? await decryptRsa(privateKeyTo, message.image)
        : undefined;
    const rsaDecryptedVideo = message.video
        ? await decryptRsa(privateKeyTo, message.video)
        : undefined;
    const rsaDecryptedAudio = message.audio
        ? await decryptRsa(privateKeyTo, message.audio)
        : undefined;

    const textAsBytes = base64ToBytes(rsaDecryptedText);
    const imageToBytes = rsaDecryptedImage ? base64ToBytes(rsaDecryptedImage) : undefined;
    const videoToBytes = rsaDecryptedVideo ? base64ToBytes(rsaDecryptedVideo) : undefined;
    const audioToBytes = rsaDecryptedAudio ? base64ToBytes(rsaDecryptedAudio) : undefined;

    // Next decrypt SDEx, at this point we will have decrypted content
    const decryptedText = sdexEngine.decryptMessage(textAsBytes);
    const decryptedImage = imageToBytes ? sdexEngine.decryptMessage(imageToBytes) : undefined;
    const decryptedVideo = videoToBytes ? sdexEngine.decryptMessage(videoToBytes) : undefined;
    const decryptedAudio = audioToBytes ? sdexEngine.decryptMessage(audioToBytes) : undefined;

    // Finally construct a Message
    return new Message(
        contactIdFrom,
        0,
        decryptedText,
        message.createdAt,
        true,
        decryptedImage,
        decryptedVideo,
        decryptedAudio,
    );
}
