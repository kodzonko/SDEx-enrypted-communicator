from typing import Any


def validate_connect_payload(data: Any) -> bool:
    """Validate the payload for user connection."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKey", None):
        return False
    return True


def validate_register_init_payload(data: Any) -> bool:
    """Validate payload for request to authenticate/register from user."""
    if not isinstance(data, str):
        return False
    return True


def validate_register_follow_up_payload(data: Any) -> bool:
    """Validate the payload for user registration."""
    if not isinstance(data, dict):
        return False
    if not data.get("login", None):
        return False
    if not data.get("publicKey", None):
        return False
    if not data.get("signature", None):
        return False
    return True


def validate_chat_payload(data: Any) -> bool:
    """Validate the payload with sent message."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKeyTo", None):
        return False
    if not data.get("publicKeyFrom", None):
        return False
    if not data.get("text", None):
        return False
    if not data.get("createdAt", None):
        return False
    return True


def validate_check_key_payload(data: Any) -> bool:
    """Validate the payload for check key request."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKey", None):
        return False
    return True


def validate_check_online_payload(data: Any) -> bool:
    """Validate the payload for check online request."""
    if not isinstance(data, dict):
        return False
    if "publicKey" not in data.keys():
        return False
    return True


def validate_check_has_crypto_context(data: Any) -> bool:
    """Validate the payload for check has crypto context request."""
    if not isinstance(data, str):
        return False
    return True


def validate_chat_init_payload(data: Any) -> bool:
    """Validate the payload for chat initialization request."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKeyFrom", None):
        return False
    if not data.get("publicKeyTo", None):
        return False
    if not data.get("sessionKeyPartEncrypted", None):
        return False
    return True


def validate_update_public_key_payload(data: Any) -> bool:
    """Validate the payload for update login request."""
    if not isinstance(data, dict):
        return False
    if not data.get("login", None):
        return False
    if not data.get("publicKey", None):
        return False
    return True
