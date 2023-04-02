PROJECT_ROOT := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
SRC := $(PROJECT_ROOT)src
TESTS := $(PROJECT_ROOT)tests

run:
	poetry run uvicorn $(SRC).main:app --reload

lint:
	poetry run autoflake $(SRC) $(TESTS)
	poetry run isort $(SRC) $(TESTS)
	poetry run black $(SRC) $(TESTS)

test-unit:
	poetry run pytest --failed-first --new-first --cov=$(SRC) $(TESTS)/unit

test-integration:
	poetry run pytest $(TESTS)/integration
