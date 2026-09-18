"""
Admin configuration for accounts app.
Supports direct photo file upload to Cloudinary and live thumbnail previews.
"""

import secrets
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


class UserAdminChangeForm(forms.ModelForm):
    """
    Custom form for editing users in Django Admin.
    Allows uploading an image file from the computer or pasting a URL.
    """
    photo_file = forms.FileField(
        required=False,
        label="Upload Photo (from your computer)",
        help_text="Select an image file to upload directly to Cloudinary (Optional)."
    )

    class Meta:
        model = User
        fields = '__all__'


class UserAdminAddForm(forms.ModelForm):
    """
    Custom form for creating users in Django Admin.
    Password is optional for students (auto-generated for passwordless login).
    """
    role = forms.ChoiceField(choices=User.ROLE_CHOICES, initial='student', required=True)
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)
    photo_file = forms.FileField(
        required=False,
        label="Upload Photo (from your computer)",
        help_text="Select an image file to upload directly to Cloudinary (Optional)."
    )
    photo_url = forms.URLField(
        required=False,
        help_text="Or paste image URL (Cloudinary / CDN)."
    )
    username = forms.CharField(
        required=False,
        help_text="Optional — auto-generated from name if left empty."
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        label="Password",
        help_text="Not required for students (auto-generated for passwordless login)."
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        label="Confirm Password",
        help_text="Confirm password if provided."
    )

    class Meta:
        model = User
        fields = ('role', 'first_name', 'last_name', 'photo_file', 'photo_url', 'username', 'email')

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get('role')
        pass1 = cleaned_data.get('password1')
        pass2 = cleaned_data.get('password2')

        if role != 'student' and not pass1:
            self.add_error('password1', 'Password is required for instructors/administrators.')

        if pass1 or pass2:
            if pass1 != pass2:
                self.add_error('password2', 'Passwords do not match.')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = self.cleaned_data.get('first_name', '').strip()
        user.last_name = self.cleaned_data.get('last_name', '').strip()
        user.role = self.cleaned_data.get('role')
        user.photo_url = self.cleaned_data.get('photo_url', '').strip()

        pass1 = self.cleaned_data.get('password1')
        if pass1:
            user.set_password(pass1)
        else:
            user.set_password(secrets.token_urlsafe(32))

        if not user.username:
            fname = user.first_name.lower().replace(' ', '')
            lname = user.last_name.lower().replace(' ', '')
            base_username = f"{fname}.{lname}" if (fname or lname) else "student"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user.username = username

        if commit:
            user.save()
        return user


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminAddForm
    list_display = ['photo_thumbnail', 'username', 'email', 'first_name', 'last_name', 'role', 'student_id', 'is_staff', 'is_superuser', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering = ['last_name', 'first_name']

    def photo_thumbnail(self, obj):
        url = obj.photo_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={obj.first_name}{obj.last_name}"
        return format_html(
            '<img src="{}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #ddd;" />',
            url
        )
    photo_thumbnail.short_description = "Photo"

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Student Photo', {
            'fields': ('role', 'student_id', 'photo_file', 'photo_url'),
            'description': 'Upload a photo file from your computer OR paste an image URL (Optional).',
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('role', 'first_name', 'last_name', 'photo_file', 'photo_url', 'username', 'email', 'password1', 'password2'),
        }),
    )

    def save_model(self, request, obj, form, change):
        photo_file = form.cleaned_data.get('photo_file')
        if photo_file:
            try:
                import cloudinary
                import cloudinary.uploader
                upload_res = cloudinary.uploader.upload(
                    photo_file,
                    folder='gradeportal/students',
                    transformation=[{'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face', 'quality': 'auto'}]
                )
                obj.photo_url = upload_res.get('secure_url') or upload_res.get('url')
            except Exception:
                # Fallback to base64 Data URI if Cloudinary is unreachable
                try:
                    import base64
                    photo_file.seek(0)
                    encoded = base64.b64encode(photo_file.read()).decode('utf-8')
                    mime = getattr(photo_file, 'content_type', 'image/jpeg')
                    obj.photo_url = f"data:{mime};base64,{encoded}"
                except Exception:
                    pass
        super().save_model(request, obj, form, change)
