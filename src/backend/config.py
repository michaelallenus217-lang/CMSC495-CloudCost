import os

class BaseConfig:
    ENV = os.getenv("ENV", "local")
    AZURE_SQL_SERVER = os.getenv("AZURE_SQL_SERVER")
    AZURE_SQL_DATABASE = os.getenv("AZURE_SQL_DATABASE")

    SQL_POOL_SIZE = int(os.getenv("SQL_POOL_SIZE", "5"))
    SQL_MAX_OVERFLOW = int(os.getenv("SQL_MAX_OVERFLOW", "10"))
    SQL_POOL_RECYCLE = int(os.getenv("SQL_POOL_RECYCLE", "1800"))  # seconds


class LocalConfig(BaseConfig):
    DEBUG = True


class ProdConfig(BaseConfig):
    DEBUG = False
