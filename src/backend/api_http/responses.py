"""
File: __init__.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Provides standardized JSON structured response templates
"""

from flask import jsonify

def ok(data=None, meta=None, status_code=200):
    payload = {
        "status": "ok"
    }

    if data is not None:
        payload["data"] = data

    if meta is not None:
        payload["meta"] = meta

    return jsonify(payload), status_code


def error(type, message, details=None, status_code=400):
    payload = {
        "status": "error",
        "error": {
            "code": type,
            "message": message,
        },
    }
    
    if details is not None:
        payload["error"]["details"] = details

    return jsonify(payload), status_code
