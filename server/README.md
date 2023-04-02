# SETUP

Wymagania:

- [Python 3.10+](https://www.python.org/downloads/windows/)
- [Poetry](https://github.com/python-poetry/install.python-poetry.org)

Instalacja:

```shell
cd <project_dir>/server
poetry install
$ poetry run uvicorn src.main:app --reload
(...)
INFO:     Application startup complete.
```

Aby zobaczyć dokumentację API przejdź do [Swagger](http://127.0.0.1:8000/docs).
