"""
File: fields.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Define API field parsing rules
"""

# backend/api_http/fields.py
from marshmallow import fields, ValidationError
from decimal import Decimal, InvalidOperation
from typing import Any

class FlexibleDecimal(fields.Field):
    """Accept Decimal/int/float/str and return Decimal."""
    def _deserialize(self, value: Any, attr: str | None, data: Any, **kwargs) -> Decimal:
        field = attr or "value"
        try:
            if isinstance(value, Decimal):
                return value
            if isinstance(value, int):
                return Decimal(value)
            if isinstance(value, float):
                return Decimal(str(value))
            if isinstance(value, str):
                return Decimal(value)
        except (InvalidOperation, ValueError):
            raise ValidationError(f"{field} must be a number or numeric string")
        raise ValidationError(f"{field} must be a number or numeric string")