export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionError";
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

export class SecureStoreDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecureStoreDatabaseError";
  }
}

export class DataHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataHandlerError";
  }
}
