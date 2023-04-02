import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


CONNECTION_STRING = os.getenv("CONNECTION_STRING")
MONGO_AUTH_CERT_PATH = Path(os.getenv("MONGO_AUTH_CERT_PATH"))

# Validate if environment variables are set
env_vars = [CONNECTION_STRING, MONGO_AUTH_CERT_PATH]
for var in env_vars:
    if not var:
        raise EnvironmentError(
            "Missing environmental variable: %s" % f"{var=}".split("=")[0]
        )
