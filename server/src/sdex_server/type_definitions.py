from typing import TypeAlias

from bidict import bidict

PublicKeysSidsMappingType: TypeAlias = bidict[str, str]
