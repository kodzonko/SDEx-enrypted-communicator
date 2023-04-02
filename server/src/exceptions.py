GENERIC_DB_CONN_ERROR = (
    "An error occurred when trying to exchange data with the database."
)


class DBConnectionError(Exception):
    """Raised when exchanging resources with the db failed."""


class EnvironmentError(Exception):
    """Raised when environment variables are missing."""
