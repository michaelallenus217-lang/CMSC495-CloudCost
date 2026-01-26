import os
import struct
from azure.identity import InteractiveBrowserCredential, DefaultAzureCredential
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool

SQL_COPT_SS_ACCESS_TOKEN = 1256  # ODBC access token attribute


def _get_credential():
    env = os.getenv("ENV", "local").lower()

    # Local dev: interactive browser auth
    if env == "local":
        # Optional: set a tenant_id if your org has multiple tenants
        return InteractiveBrowserCredential()

    # Non-local: use the standard chain (Managed Identity, workload identity, etc.)
    return DefaultAzureCredential()


def _get_access_token() -> str:
    credential = _get_credential()
    token = credential.get_token("https://database.windows.net/.default")
    return token.token


def _odbc_access_token(token: str) -> bytes:
    token_bytes = token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)


def build_engine(server: str, database: str, pool_size: int, max_overflow: int, pool_recycle: int) -> Engine:
    if not server or not database:
        raise ValueError("AZURE_SQL_SERVER and AZURE_SQL_DATABASE must be set")

    driver = "ODBC Driver 18 for SQL Server"
    odbc_connect = (
        f"Driver={{{driver}}};"
        f"Server=tcp:{server},1433;"
        f"Database={database};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )

    connect_args = {
        "attrs_before": {
            SQL_COPT_SS_ACCESS_TOKEN: _odbc_access_token(_get_access_token())
        }
    }

    return create_engine(
        "mssql+pyodbc:///?odbc_connect=" + odbc_connect,
        connect_args=connect_args,
        poolclass=QueuePool,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_recycle=pool_recycle,
        pool_pre_ping=True,
        future=True,
    )
