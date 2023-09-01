from typing import Literal, TypeAlias

from bidict import bidict

PublicKeysSidsMappingType: TypeAlias = bidict[str, str]

ResponseStatusType = Literal["success", "error"]
