export class SdexEncryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EncryptionError";
    }
}

export class SdexDecryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DecryptionError";
    }
}

export class PreconditionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreconditionError";
    }
}

export class FileSystemError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FileSystemError";
    }
}

export class SqlDatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SqlDatabaseError";
    }
}

export class DataHandlerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DataHandlerError";
    }
}

export class RsaGenerationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RsaGenerationError";
    }
}

export class RsaEncryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RsaEncryptionError";
    }
}

export class RsaDecryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RsaDecryptionError";
    }
}

export class RsaSigningError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RsaSigningError";
    }
}

export class CommunicationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CommunicationError";
    }
}
