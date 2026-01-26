from pathlib import Path
from dotenv import load_dotenv
from flask import Flask

# Always load src/backend/.env deterministically
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)

def create_app() -> Flask:
    # Import config AFTER dotenv is loaded
    from backend.config import LocalConfig, ProdConfig
    from backend.db.engine import build_engine
    from backend.db.session import init_session_factory, remove_db_session
    from backend.routes.v1 import api_v1_bp
    import os

    app = Flask(__name__)

    env = os.getenv("ENV", "local").lower()
    app.config.from_object(LocalConfig if env == "local" else ProdConfig)

    engine = build_engine(
        server=app.config["AZURE_SQL_SERVER"],
        database=app.config["AZURE_SQL_DATABASE"],
        pool_size=app.config["SQL_POOL_SIZE"],
        max_overflow=app.config["SQL_MAX_OVERFLOW"],
        pool_recycle=app.config["SQL_POOL_RECYCLE"],
    )
    init_session_factory(engine)
    app.teardown_appcontext(remove_db_session)

    app.register_blueprint(api_v1_bp)
    return app
