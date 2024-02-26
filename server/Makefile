PROJECT_ROOT := $(dir $(abspath $(firstword $(MAKEFILE_LIST))))
SRC := $(PROJECT_ROOT)src
TESTS := $(PROJECT_ROOT)tests

install:
	poetry install

run:
	poetry run python $(SRC)/sdex_server/main.py

lint:
	poetry run ruff $(SRC)

format:
	poetry run black --config $(PROJECT_ROOT)pyproject.toml $(SRC) $(TESTS)
	poetry run isort --settings-path $(PROJECT_ROOT)pyproject.toml $(SRC) $(TESTS)

test-unit:
	poetry run pytest --failed-first --new-first --cov=$(SRC) $(TESTS)/unit

update-deps:
	poetry update
