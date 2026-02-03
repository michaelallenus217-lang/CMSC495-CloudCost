"""
File: engine.py
Project: Cloud Cost Intelligence Platform
Author: Tony (Database Lead), Sean Kellner (Backend Lead)
Created: January 2026
Description: SQLAlchemy engine configuration. Handles Azure SQL connection
             with Microsoft Entra authentication and device code flow.
"""

import os
import sys
import struct
from azure.identity import (
    DefaultAzureCredential,
    DeviceCodeCredential,
    InteractiveBrowserCredential,
)
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool
import time

SQL_COPT_SS_ACCESS_TOKEN = 1256  # ODBC access token attribute



def _get_credential():
    azure_identity_mode = os.getenv("AZURE_IDENTITY_MODE", "default").strip().lower()

    if azure_identity_mode == "default":
        # Production-oriented default. In dev, this can also work if you have az login, etc.
        return DefaultAzureCredential(exclude_interactive_browser_credential=True)

    if azure_identity_mode == "devicecode":
        return DeviceCodeCredential()

    if azure_identity_mode == "interactive":
        return InteractiveBrowserCredential()

    raise ValueError(f"Unknown AZURE_IDENTITY_MODE: {azure_identity_mode}")


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
        "Connection Timeout=60;"
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
