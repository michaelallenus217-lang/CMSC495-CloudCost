"""
File: schemas.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: Feburary 2026
Description: Defined API parameter schemas that endpoints can make use of
"""

from marshmallow import EXCLUDE, Schema, fields, validate, validates_schema, ValidationError, RAISE
from backend.api_http.fields import FlexibleDecimal



# For endpoints that return lists of data in pages
# NOTE: Max page size is 50000
class PagedSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    limit = fields.Int(
        load_default=10,
        validate=validate.Range(min=1, max=50000),
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



class BudgetPatchSchema(Schema):
    class Meta:
        unknown = RAISE  # reject any field not defined here

    alert_enabled = fields.Bool()
    alert_threshold = FlexibleDecimal()
    budget_amount = FlexibleDecimal()
    monthly_limit = FlexibleDecimal()