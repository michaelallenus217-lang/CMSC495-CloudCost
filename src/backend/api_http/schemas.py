"""
File: __init__.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Defined API parameter schemas that endpoints can make use of
"""

from marshmallow import Schema, fields, validate

class PagingSchema(Schema):
    limit = fields.Int(
        load_default=10,
        validate=validate.Range(min=1, max=1000),
    )

    offset = fields.Int(
        load_default=0,
        validate=validate.Range(min=0)
    )
