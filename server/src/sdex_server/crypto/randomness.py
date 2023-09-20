import secrets
import string


def generate_challenge() -> str:
    """Generate a random challenge for the client to authenticate."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for i in range(512))  # type: ignore
