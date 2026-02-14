"""
File: error_handlers.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Automatically returns error API responses when invalid API parameters are processed
"""

from marshmallow import ValidationError
from backend.api_http.responses import error_bad_request

def register_error_handlers(bp):
    @bp.app_errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        return error_bad_request(e.messages)