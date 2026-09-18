"""
Custom permissions for role-based access control.
"""

from rest_framework import permissions


class IsInstructor(permissions.BasePermission):
    """Allow access to instructors and administrators / superusers."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('instructor', 'admin')
                or request.user.is_staff
                or request.user.is_superuser
            )
        )


class IsAdmin(permissions.BasePermission):
    """Allow access only to administrators and superusers."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == 'admin'
                or request.user.is_staff
                or request.user.is_superuser
            )
        )


class IsStudent(permissions.BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsInstructorOrReadOnly(permissions.BasePermission):
    """Allow full access to instructors and admins, read-only to others."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('instructor', 'admin')
                or request.user.is_staff
                or request.user.is_superuser
            )
        )
