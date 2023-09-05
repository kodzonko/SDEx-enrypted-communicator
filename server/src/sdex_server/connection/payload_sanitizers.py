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
    if not isinstance(data, dict):
        return False
    if "publicKey" not in data.keys():
        return False
    return True


def validate_register_follow_up_payload(data: Any) -> bool:
    """Validate the payload for user registration."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKey", None):
        return False
    if not data.get("privateKeyHash", None):
        return False
    if not data.get("salt", None):
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


def validate_chat_init_payload(data: Any) -> bool:
    """Validate the payload for chat initialization request."""
    if not isinstance(data, dict):
        return False
    if not data.get("publicKeyFrom", None):
        return False
    if not data.get("publicKeyTo", None):
        return False
    if not data.get("initializationHashEncrypted", None):
        return False
    if not data.get("hashFromUserPasswordEncrypted", None):
        return False
    if not data.get("sessionKeyEncrypted", None):
        return False
    return True
