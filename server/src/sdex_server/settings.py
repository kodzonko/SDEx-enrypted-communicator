import os
from pathlib import Path

import rsa
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

_env_path = os.getenv("SQLITE_DB_PATH")
if not _env_path:
    raise EnvironmentError("SQLITE_DB_PATH environment variable is not set.")
SQLITE_DB_PATH = Path(_env_path)

_host_address = os.getenv("HOST_ADDRESS")
if not _host_address:
    raise EnvironmentError("HOST_ADDRESS environment variable is not set.")
HOST_ADDRESS = _host_address

_host_port = os.getenv("HOST_PORT")
if not _host_port:
    raise EnvironmentError("HOST_ADDRESS environment variable is not set.")
HOST_PORT = int(_host_port)

_server_public_key_file_path = os.getenv("SERVER_PUBLIC_KEY_PATH")
if not _server_public_key_file_path:
    raise EnvironmentError("SERVER_PUBLIC_KEY_PATH environment variable is not set.")
with open(_server_public_key_file_path) as f:
    try:
        SERVER_PUBLIC_KEY = rsa.PublicKey.load_pkcs1(f.read())  # type: ignore
    except Exception as e:
        raise EnvironmentError(
            "Unable to set SERVER_PUBLIC_KEY. Key in the file is not valid."
        ) from e
if not SERVER_PUBLIC_KEY:
    raise EnvironmentError("SERVER_PUBLIC_KEY environment variable is not set.")

with open(_server_public_key_file_path, "r") as f:
    SERVER_PUBLIC_KEY_CLEAR_TEXT: str = f.read()

_server_private_key_file = os.getenv("SERVER_PRIVATE_KEY_PATH")
if not _server_private_key_file:
    raise EnvironmentError("SERVER_PRIVATE_KEY_PATH environment variable is not set.")
with open(_server_private_key_file) as f:
    try:
        SERVER_PRIVATE_KEY = rsa.PrivateKey.load_pkcs1(f.read())  # type: ignore
    except Exception as e:
        raise EnvironmentError(
            "Unable to set SERVER_PRIVATE_KEY. Key in the file is not valid."
        ) from e
if not SERVER_PRIVATE_KEY:
    raise EnvironmentError("SERVER_PRIVATE_KEY environment variable is not set.")
