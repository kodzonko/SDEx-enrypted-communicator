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
export function prepareToSend(
    message: Message,
    publicKeyFrom: string,
    publicKeyTo: string,
    sdexEngine: SdexCrypto,
): TransportedMessage {
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

    const sdexEncryptedMessage = new Message(
        message.contactIdFrom,
        message.contactIdTo,
        sdexEncryptedText,
        message.createdAt,
        message.unread,
        sdexEncryptedImage,
        sdexEncryptedVideo,
        sdexEncryptedAudio,
        message.id,
    );

    // Convert a message to a TransportedMessage which has metadata needed for server and receiver to process it.
    const transportedMessage = messageToTransportedMessage(
        sdexEncryptedMessage,
        publicKeyFrom,
        publicKeyTo,
    );

    return transportedMessage;
}

/**
 * Handle a message received from server and prepare it to save to database and present to user (i.e. decrypt and parse)
 * @param message A message from server
 * @param sdexEngine object responsible for decryption, with appropriate context for the task
 * @param contactIdTo receiver's contact id (first party's ID == 0)
 * @param contactIdFrom sender's contact id
 * @returns Message decrypted and parsed into Message object
 */
export function prepareToIngest(
    message: TransportedMessage,
    sdexEngine: SdexCrypto,
    contactIdFrom: number,
): Message {
    const textAsBytes = base64ToBytes(message.text);
    const imageToBytes = message.image ? base64ToBytes(message.image) : undefined;
    const videoToBytes = message.video ? base64ToBytes(message.video) : undefined;
    const audioToBytes = message.audio ? base64ToBytes(message.audio) : undefined;

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
