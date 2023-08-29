def validate_user_register_payload(data) -> bool:
    """Validate the payload for user registration."""
    if not data.get("public_rsa"):
        return False
    if not data.get("public_rsa"):
        return False
    return True
