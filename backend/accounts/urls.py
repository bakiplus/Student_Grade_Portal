"""
URL patterns for accounts app — authentication, student management, and Cloudinary uploads.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Auth Endpoints
    path('student/login/', views.StudentLoginView.as_view(), name='auth-student-login'),
    path('instructor/login/', views.InstructorLoginView.as_view(), name='auth-instructor-login'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('me/', views.CurrentUserView.as_view(), name='auth-me'),
    # Cloudinary Upload
    path('upload-photo/', views.PhotoUploadView.as_view(), name='auth-upload-photo'),
    # Student & Instructor management
    path('students/', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', views.StudentDetailUpdateView.as_view(), name='student-detail-update'),
    path('instructors/', views.InstructorListCreateView.as_view(), name='instructor-list-create'),
]
