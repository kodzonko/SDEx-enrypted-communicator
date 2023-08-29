import secrets
import string


def generate_salt() -> str:
    """Generate a random salt for the client's private key."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for i in range(512))
