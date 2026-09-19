"""
Serializers for User authentication and management.
"""

import secrets
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class InstructorLoginSerializer(serializers.Serializer):
    """Validates instructor/admin login credentials (username/email + password)."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username_input = data['username'].strip()
        password = data['password']

        # Allow logging in with either username or email (case-insensitive)
        if '@' in username_input:
            try:
                user_obj = User.objects.get(email__iexact=username_input)
                username_input = user_obj.username
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass
        else:
            try:
                user_obj = User.objects.get(username__iexact=username_input)
                username_input = user_obj.username
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass

        user = authenticate(username=username_input, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials. Please check your username/email and password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        if user.role not in ('instructor', 'admin') and not user.is_staff and not user.is_superuser:
            raise serializers.ValidationError("Access denied. This portal is for instructors and administrators.")

        # Ensure role is set for superusers/staff if missing
        if not user.role or user.role == 'student':
            if user.is_superuser or user.is_staff:
                user.role = 'admin'
                user.save(update_fields=['role'])

        data['user'] = user
        return data


AMHARIC_NAME_MAP = {
    'ኑሃሚን': 'nuhamin', 'ኑሀሚን': 'nuhamin', 'ኑሐሚን': 'nuhamin',
    'ቤተልሔም': 'betelhem', 'ቤቴልሔም': 'betelhem', 'ቤተልሄም': 'betelhem', 'ቤቴልሄም': 'betelhem', 'ቤተልኤም': 'betelhem',
    'ቤተማርያም': 'betemariam', 'ቤተማሪያም': 'betemariam', 'ቤተ ማርያም': 'betemariam',
    'ነቢዩ': 'nebiyu', 'ነብዩ': 'nebiyu',
    'ዮስቲና': 'yostena', 'ዮስቴና': 'yostena', 'ዮስቴነ': 'yostena',
    'ትንሣኤ': 'tinsae', 'ትንሳኤ': 'tinsae', 'ትንሳይ': 'tinsae',
    'እያሱ': 'eyasu', 'ኢያሱ': 'eyasu',
    'ሃና': 'hana', 'ሐና': 'hana', 'ሀና': 'hana',
    'ሶስና': 'sosina', 'ሶሲና': 'sosina',
    'ሄርሜላ': 'hermela', 'ሔርሜላ': 'hermela', 'ሄርመላ': 'hermela',
    'መቅደስ': 'mekdes',
    'ኤልዳና': 'eldana',
    'ክብር': 'kiber', 'ክብረ': 'kiber', 'ኪበር': 'kiber',
    'ዮናስ': 'yonas',
    'ተባረክ': 'tebarek',
    'ዳግም': 'dagim', 'ዳጊም': 'dagim',
    'ዮሐንስ': 'yohannes', 'ዮሃንስ': 'yohannes', 'ዮሀንስ': 'yohannes',
    'ኤልያስ': 'elias', 'ኢልያስ': 'elias',
    'ኪሩቤል': 'kirubel', 'ኪሩበል': 'kirubel',
    'ባንቺ': 'beanchi', 'በአንቺ': 'beanchi', 'ቢያንቺ': 'beanchi', 'ባንቺአምላክ': 'beanchi',
    'ዳናዊት': 'danawit',
    'ናርዶስ': 'nardos',
    'ምሕረት': 'mihret', 'ምህረት': 'mihret',
    'ሜሮን': 'meron', 'መሮን': 'meron',
    'ሮዛ': 'roza',
    'ዕፁብድንቅ': 'eitsubdink', 'እጹብድንቅ': 'eitsubdink', 'እፁብድንቅ': 'eitsubdink', 'እጹብ': 'eitsubdink',
    'የአብስራ': 'yeabsira', 'የዓብስራ': 'yeabsira', 'ያብስራ': 'yeabsira',
    'ጽዮን': 'tsion', 'ፂዮን': 'tsion', 'ፅዮን': 'tsion', 'ጺዮን': 'tsion',
    'ኤልሳቤጥ': 'elsabet', 'ኤልሳቤት': 'elsabet', 'ኤልሳበት': 'elsabet',
}


class StudentLoginSerializer(serializers.Serializer):
    """Validates student login via Student ID and First Name (supports English & Amharic)."""
    student_id = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)

    def validate(self, data):
        raw_student_id = data['student_id'].strip()
        student_id_upper = raw_student_id.upper()
        raw_first_name = data['first_name'].strip()

        # Try exact student_id match
        student = User.objects.filter(student_id__iexact=student_id_upper, role='student').first()

        # If not found, try flexible student_id (e.g. user entered "260001" instead of "STU-260001")
        if not student:
            clean_num = student_id_upper.replace('STU', '').replace('-', '').strip()
            if clean_num:
                student = User.objects.filter(student_id__icontains=clean_num, role='student').first()

        # Fallback to username if student ID wasn't recognized
        if not student:
            student = User.objects.filter(username__iexact=raw_student_id, role='student').first()

        if not student:
            raise serializers.ValidationError("የተማሪ መታወቂያ አልተገኘም። እባክዎ መታወቂያ ቁጥርዎን ያረጋግጡ (Student ID not found).")

        if not student.is_active:
            raise serializers.ValidationError("ይህ የተማሪ አካውንት ተዘግቷል (This student account has been deactivated).")

        # Normalize input first name (take first word if student entered full name)
        first_word = raw_first_name.split()[0].lower() if raw_first_name else ''
        mapped_name = AMHARIC_NAME_MAP.get(raw_first_name, AMHARIC_NAME_MAP.get(first_word, first_word))

        db_first_name = (student.first_name or '').strip().lower()
        db_full_name = (student.get_full_name() or '').strip().lower()

        # Verify match with English name, Amharic transliteration, or full name
        is_match = (
            mapped_name == db_first_name or
            first_word == db_first_name or
            raw_first_name.lower() == db_first_name or
            db_first_name in raw_first_name.lower() or
            (mapped_name and mapped_name in db_full_name)
        )

        if not is_match:
            raise serializers.ValidationError(
                f"የመጀመሪያ ስም ከዚህ መታወቂያ ({student.student_id}) ጋር አይዛመድም። እባክዎ በትክክል ያስገቡ።"
            )

        data['user'] = student
        return data


class LoginSerializer(serializers.Serializer):
    """
    Unified Login serializer supporting both:
    1. Student access via (student_id, first_name)
    2. Instructor/Admin access via (username, password)
    """
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        student_id = data.get('student_id')
        first_name = data.get('first_name')
        username = data.get('username')
        password = data.get('password')

        if student_id and first_name:
            student_serializer = StudentLoginSerializer(data={'student_id': student_id, 'first_name': first_name})
            student_serializer.is_valid(raise_exception=True)
            data['user'] = student_serializer.validated_data['user']
            return data
        elif username and password:
            instructor_serializer = InstructorLoginSerializer(data={'username': username, 'password': password})
            instructor_serializer.is_valid(raise_exception=True)
            data['user'] = instructor_serializer.validated_data['user']
            return data
        else:
            raise serializers.ValidationError("Please provide either Student ID + First Name or Username + Password.")


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'student_id', 'photo_url', 'is_staff', 'is_superuser', 'created_at',
        ]
        read_only_fields = fields


class CreateInstructorSerializer(serializers.ModelSerializer):
    """
    Serializer for administrators to create instructor accounts with password.
    """
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(write_only=True, required=True, min_length=4)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password',
        ]
        read_only_fields = ['id']

    def validate_username(self, value):
        if value and User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data, role='instructor')
        user.set_password(password)
        user.save()
        return user


class CreateStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for instructors to create student accounts without requiring a password.
    Requires first_name and last_name; supports optional photo_url.
    """
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    photo_url = serializers.CharField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'photo_url', 'student_id',
        ]
        read_only_fields = ['id', 'student_id']

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        username = validated_data.get('username', '').strip()
        photo_url = validated_data.get('photo_url', '').strip()

        if not username:
            base_username = f"{first_name.lower().replace(' ', '')}.{last_name.lower().replace(' ', '')}"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username

        # Keep photo_url blank/empty if not uploaded
        validated_data['photo_url'] = photo_url

        user = User(**validated_data, role='student')
        user.set_password(secrets.token_urlsafe(32))
        user.save()
        return user


class UpdateStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for instructors to update student info and upload/modify optional photo_url.
    """
    first_name = serializers.CharField(required=False, max_length=150)
    last_name = serializers.CharField(required=False, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    photo_url = serializers.CharField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'photo_url', 'student_id',
        ]
        read_only_fields = ['id', 'username', 'student_id']

    def update(self, instance, validated_data):
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name'].strip()
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name'].strip()
        if 'email' in validated_data:
            instance.email = validated_data['email'].strip()
        if 'photo_url' in validated_data:
            instance.photo_url = validated_data['photo_url'].strip() if validated_data['photo_url'] else ''

        instance.save()
        return instance
