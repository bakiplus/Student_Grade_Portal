"""
Seed the database with test data for development.
Creates instructor, students, courses, enrollments, grade components, sample grades, and calculates/publishes CS101 results.

Usage: python manage.py shell < seed_data.py
"""

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
import secrets
import random
from accounts.models import User
from courses.models import Course, Enrollment, GradeComponent
from grades.models import StudentGrade, Result
from grades.services import calculate_course_results, publish_course_results

print("=" * 60)
print("  Seeding Student Grade Portal Database")
print("=" * 60)

# ─── Create Superadmins ────────────────────────────────────────────────────────

superadmins_data = [
    {
        'username': 'biruk',
        'email': 'yoseftamrat923@gmail.com',
        'first_name': 'Biruk',
        'last_name': 'Tamrat',
        'password': 'biruk123',
    },
    {
        'username': 'Isaac',
        'email': 'Issacbrown016@gmail.com',
        'first_name': 'Isaac',
        'last_name': 'Brown',
        'password': 'biruk123',
    },
    {
        'username': 'admin',
        'email': 'admin@gradeportal.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'password': 'admin123',
    },
]

for sdata in superadmins_data:
    password = sdata.pop('password')
    admin_user, _ = User.objects.get_or_create(
        username=sdata['username'],
        defaults={**sdata, 'role': 'admin', 'is_staff': True, 'is_superuser': True, 'is_active': True},
    )
    admin_user.role = 'admin'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.is_active = True
    admin_user.email = sdata['email']
    admin_user.first_name = sdata['first_name']
    admin_user.last_name = sdata['last_name']
    admin_user.set_password(password)
    admin_user.save()
    print(f"✓ Verified Superadmin: {admin_user.username} ({admin_user.email}) / {password}")

# ─── Create Instructors ──────────────────────────────────────────────────────

instructors_data = [
    {
        'username': 'dr.smith',
        'email': 'smith@gradeportal.com',
        'first_name': 'John',
        'last_name': 'Smith',
        'password': 'instructor123',
    },
    {
        'username': 'dr.johnson',
        'email': 'johnson@gradeportal.com',
        'first_name': 'Sarah',
        'last_name': 'Johnson',
        'password': 'instructor123',
    },
]

instructors = []
for data in instructors_data:
    password = data.pop('password')
    instructor, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'instructor'},
    )
    if created:
        instructor.set_password(password)
        instructor.save()
        print(f"✓ Created instructor: {instructor.username} / {password}")
    else:
        print(f"· Instructor {instructor.username} already exists")
    instructors.append(instructor)

# ─── Create Students (with Profile Avatars) ───────────────────────────────────

students_raw = [
    ("Nuhamin", "Abraham"),
    ("Nuhamin", "Selamu"),
    ("Nuhamin", "Bekele"),
    ("Betelhem", "Dese"),
    ("Betemariam", "Matewos"),
    ("Nebiyu", "Samuel"),
    ("Yostena", "Marshet"),
    ("Tinsae", "Melaku"),
    ("Eyasu", "Melkamu"),
    ("Hana", "Amare"),
    ("Sosina", "Solomon"),
    ("Hermela", "Tariku"),
    ("Mekdes", "Daniel"),
    ("Eldana", "Amene"),
    ("Kiber", "Yilkal"),
    ("Yonas", "Asfaw"),
    ("Tebarek", "Solomon"),
    ("Dagim", "Fiseha"),
    ("Yohannes", "Fiseha"),
    ("Elias", "Birhanu"),
    ("Kirubel", "Asefa"),
    ("Beanchi", "Amlak Molla"),
    ("Danawit", "Fentahun"),
    ("Nardos", "Atanaw"),
    ("Mihret", "Asemaraw"),
    ("Meron", "Tefera"),
    ("Roza", "Muluqen"),
    ("Eitsubdink", "Dawit"),
    ("Yeabsira", "Andargachew"),
    ("Tsion", "Melaku"),
    ("Elsabet", "Amare"),
]

students_data = []
for index, (first_name, last_name) in enumerate(students_raw, start=1):
    clean_first = first_name.strip()
    clean_last = last_name.strip()
    clean_first_user = clean_first.lower().replace(' ', '')
    clean_last_user = clean_last.lower().replace(' ', '')
    username = f"{clean_first_user}.{clean_last_user}"
    email = f"{clean_first_user}.{clean_last_user}@student.com"
    student_id = f"STU-26{index:04d}"

    students_data.append({
        'username': username,
        'email': email,
        'first_name': clean_first,
        'last_name': clean_last,
        'photo_url': '',
        'student_id': student_id,
    })

students = []
for data in students_data:
    stu_id = data.pop('student_id')
    photo = data.get('photo_url')
    student, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'student', 'student_id': stu_id},
    )
    if not created:
        student.first_name = data['first_name']
        student.last_name = data['last_name']
        student.student_id = stu_id
        student.photo_url = photo
        student.role = 'student'
        student.save()
    if created:
        student.set_password(secrets.token_urlsafe(32))
        student.save()
        print(f"✓ Created student: {student.get_full_name()} (ID: {student.student_id}, First Name: {student.first_name})")
    else:
        print(f"· Student {student.get_full_name()} updated (ID: {student.student_id})")
    students.append(student)

# ─── Create Courses ───────────────────────────────────────────────────────────

courses_data = [
    {
        'code': 'CS101',
        'name': 'Introduction to Computer Science',
        'description': 'Fundamental concepts of computer science including algorithms, data structures, and programming.',
        'instructor': instructors[0],
        'credit_hours': 3,
    },
    {
        'code': 'MATH201',
        'name': 'Linear Algebra',
        'description': 'Study of vectors, matrices, linear transformations, and eigenvalues.',
        'instructor': instructors[0],
        'credit_hours': 4,
    },
    {
        'code': 'ENG102',
        'name': 'Academic Writing',
        'description': 'Developing academic writing skills for research papers and essays.',
        'instructor': instructors[1],
        'credit_hours': 3,
    },
]

courses = []
for data in courses_data:
    course, created = Course.objects.get_or_create(
        code=data['code'],
        defaults=data,
    )
    if created:
        print(f"✓ Created course: {course.code} — {course.name}")
    else:
        print(f"· Course {course.code} already exists")
    courses.append(course)

# ─── Define Grade Components ─────────────────────────────────────────────────

components_data = {
    'CS101': [
        {'name': 'Midterm Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('25'), 'display_order': 1},
        {'name': 'Final Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('35'), 'display_order': 2},
        {'name': 'Assignments', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 3},
        {'name': 'Lab Work', 'max_score': Decimal('50'), 'weight_percent': Decimal('20'), 'display_order': 4},
    ],
    'MATH201': [
        {'name': 'Midterm Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('30'), 'display_order': 1},
        {'name': 'Final Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('40'), 'display_order': 2},
        {'name': 'Homework', 'max_score': Decimal('100'), 'weight_percent': Decimal('15'), 'display_order': 3},
        {'name': 'Quizzes', 'max_score': Decimal('50'), 'weight_percent': Decimal('15'), 'display_order': 4},
    ],
    'ENG102': [
        {'name': 'Essay 1', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 1},
        {'name': 'Essay 2', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 2},
        {'name': 'Final Paper', 'max_score': Decimal('100'), 'weight_percent': Decimal('35'), 'display_order': 3},
        {'name': 'Participation', 'max_score': Decimal('50'), 'weight_percent': Decimal('25'), 'display_order': 4},
    ],
}

for course in courses:
    for comp_data in components_data.get(course.code, []):
        comp, created = GradeComponent.objects.get_or_create(
            course=course,
            name=comp_data['name'],
            defaults=comp_data,
        )
        if created:
            print(f"  ✓ {course.code}: {comp.name} ({comp.weight_percent}%)")

# ─── Enroll Students ─────────────────────────────────────────────────────────

enrollment_map = {
    'CS101': students,
    'MATH201': students[:20],
    'ENG102': students[10:],
}

for course in courses:
    for student in enrollment_map.get(course.code, []):
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
        )
        if created:
            print(f"  ✓ Enrolled {student.get_full_name()} in {course.code}")

# ─── Enter Sample Grades & Publish CS101 ─────────────────────────────────────

random.seed(42)  # For reproducible test data

cs101 = courses[0]
cs101_components = list(GradeComponent.objects.filter(course=cs101).order_by('display_order'))
cs101_enrollments = list(Enrollment.objects.filter(course=cs101).select_related('student'))

print("\n--- Entering sample grades for CS101 ---")
for enrollment in cs101_enrollments:
    for component in cs101_components:
        min_pct = 0.55
        max_pct = 0.98
        score = round(float(component.max_score) * random.uniform(min_pct, max_pct), 2)
        score = Decimal(str(score))

        grade, created = StudentGrade.objects.update_or_create(
            enrollment=enrollment,
            component=component,
            defaults={'score': score},
        )
        if created:
            print(f"  ✓ {enrollment.student.get_full_name()} — {component.name}: {score}/{component.max_score}")

# Calculate & Publish results for CS101
try:
    calculate_course_results(cs101.id, instructors[0])
    publish_course_results(cs101.id, instructors[0])
    print("✓ Calculated and published CS101 rankings!")
except Exception as e:
    print(f"· Calculation note: {e}")

print("\n" + "=" * 60)
print("  Seed data complete!")
print("=" * 60)
print("\n--- Superadmin & Admin Accounts ---")
print(f"  Biruk:       biruk (or yoseftamrat923@gmail.com) / biruk123")
print(f"  Isaac:       Isaac (or Issacbrown016@gmail.com) / biruk123")
print(f"  Admin:       admin / admin123")
print("\n--- Instructor Accounts ---")
print(f"  Instructor:  dr.smith / instructor123")
print(f"  Instructor:  dr.johnson / instructor123")
print("\n--- Student Accounts (Student ID + First Name) ---")
for s in students:
    print(f"  Student:     {s.get_full_name():<26} ID: {s.student_id:<12} First Name: {s.first_name}")
print()
