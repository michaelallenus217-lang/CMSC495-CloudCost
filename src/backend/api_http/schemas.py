"""
File: __init__.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Defined API parameter schemas that endpoints can make use of
"""

from marshmallow import EXCLUDE, Schema, fields, validate, validates_schema, ValidationError


# For endpoints that return lists of data in pages
# NOTE: Max page size is 1000
class PagedSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    limit = fields.Int(
        load_default=10,
        validate=validate.Range(min=1, max=1000),
    )

    page = fields.Int(
        load_default=1,
        validate=validate.Range(min=1)
    )


# For endpoints that return data within date ranges (format YYY-MM-DD)
class DateRangeSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    start_date = fields.Date(load_default=None)
    end_date = fields.Date(load_default=None)

    # If both dates are provided, ensure the range is valid (start_date is before end_date)
    @validates_schema
    def validate_range(self, data, **kwargs):
        start = data.get("start_date")
        end = data.get("end_date")

        if start is not None and end is not None and start > end:
            raise ValidationError(
                {"start_date": ["start_date must be on or before end_date."]}
            )