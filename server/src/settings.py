import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

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
