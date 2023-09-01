"""Keeps track of state of the server.

Stuff related to connections, authentication, etc.
"""
# Keeps a mapping of public keys to socket ids in bidirectional dictionary, where:
#   keys are: public RSA keys
#   values are: socket ids
from bidict import bidict

from sdex_server.type_definitions import PublicKeysSidsMappingType

PUBLIC_KEYS_SIDS_MAPPING: PublicKeysSidsMappingType = bidict()
# Set of authenticated users' sids
AUTHENTICATED_USERS: set[str] = set()
