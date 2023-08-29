import asyncio
from typing import Any, Callable

import pytest


@pytest.fixture(scope="module")
def awaited_return() -> Callable[[Any], asyncio.Future]:
    """Helper function to return awaited value for async functions."""

    def inner(value: Any = None):
        f = asyncio.Future()  # type: ignore
        f.set_result(value)
        return f

    return inner
