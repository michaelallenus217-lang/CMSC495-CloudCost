"""
File: wsgi.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: WSGI entry point. Initializes Flask app and runs development
             server with configurable host, port, and debug mode.
"""

import os
from backend import create_app

app = create_app()

if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("ENV", "local").lower() == "local"
    app.run(host=host, port=port, debug=debug)
