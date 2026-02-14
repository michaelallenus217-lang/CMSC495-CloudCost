"""
File: responses.py
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

def ok_resource(resource, resource_type):
    return ok(
        data=resource,
        meta={
            "type": resource_type,
        },
    )

def ok_resource_list(resource_list, resource_type):
    return ok(
        data=resource_list,
        meta={
            "type": resource_type,
            "count": len(resource_list),
        },
    )


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

def error_resource_missing(resource_type, resource_id):
    return error(
        type="resource_not_found",
        message="Resource '"+resource_type+"' with id '"+str(resource_id)+"' could not be found.",
        status_code=404,
    )

def error_bad_request(message, details=None):
    return error(
        type="bad_request",
        message=message,
        details=details,
        status_code=400,
    )