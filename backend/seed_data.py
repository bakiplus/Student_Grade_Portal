"""
Seed the database with test data for development.
Creates instructor, students, courses, enrollments, grade components, sample grades, and calculates/publishes CS101 results.

Usage: python manage.py shell < seed_data.py
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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
    # Original Students (STU-260001 to STU-260032)
    ("Nuhamin", "Abraham", "STU-260001"),
    ("Nuhamin", "Selamu", "STU-260002"),
    ("Nuhamin", "Bekele", "STU-260003"),
    ("Betelhem", "Dese", "STU-260004"),
    ("Betemariam", "Matewos", "STU-260005"),
    ("Nebiyu", "Samuel", "STU-260006"),
    ("Yostena", "Marshet", "STU-260007"),
    ("Tinsae", "Melaku", "STU-260008"),
    ("Eyasu", "Melkamu", "STU-260009"),
    ("Hana", "Amare", "STU-260010"),
    ("Sosina", "Solomon", "STU-260011"),
    ("Hermela", "Tariku", "STU-260012"),
    ("Mekdes", "Daniel", "STU-260013"),
    ("Eldana", "Amene", "STU-260014"),
    ("Kiber", "Yilkal", "STU-260015"),
    ("Yonas", "Asfaw", "STU-260016"),
    ("Tebarek", "Solomon", "STU-260017"),
    ("Dagim", "Fiseha", "STU-260018"),
    ("Yohannes", "Fiseha", "STU-260019"),
    ("Elias", "Birhanu", "STU-260020"),
    ("Kirubel", "Asefa", "STU-260021"),
    ("Beanchi", "Amlak Molla", "STU-260022"),
    ("Danawit", "Fentahun", "STU-260023"),
    ("Nardos", "Atanaw", "STU-260024"),
    ("Mihret", "Asemaraw", "STU-260025"),
    ("Meron", "Tefera", "STU-260026"),
    ("Roza", "Muluqen", "STU-260027"),
    ("Eitsubdink", "Dawit", "STU-260028"),
    ("Yeabsira", "Andargachew", "STU-260029"),
    ("Tsion", "Melaku", "STU-260030"),
    ("Elsabet", "Amare", "STU-260031"),
    ("Athnasiya", "Tizazu", "STU-260032"),

    # Continued Students (STU-260033 to STU-260052)
    ("Rakeb", "Tesfaye", "STU-260033"),
    ("Etsgenet", "Tesfaye", "STU-260034"),
    ("Mahlet", "Solomon", "STU-260035"),
    ("Be'Emnet", "Kendu", "STU-260036"),
    ("Makda", "Getaneh", "STU-260037"),
    ("Salome", "Asemaraw", "STU-260038"),
    ("Bezawit", "Birhane", "STU-260039"),
    ("Rodas", "Abebe", "STU-260040"),
    ("Edom", "Mulualem", "STU-260041"),
    ("Yemisirach", "Baya", "STU-260042"),
    ("Melos", "Yigzaw", "STU-260043"),
    ("Nuamin", "Melaku", "STU-260044"),
    ("Absalat", "Selamsew", "STU-260045"),
    ("Yabsira", "Dawit", "STU-260046"),
    ("Philemon", "Fasil", "STU-260047"),
    ("Abel", "Sigtetaw", "STU-260048"),
    ("Daniel", "Yoseph", "STU-260049"),
    ("Yoseph", "Marshet", "STU-260050"),
    ("Surafel", "Dejen", "STU-260051"),
    ("Yonatan", "Abiy", "STU-260052"),

    # Batch 3 Students (STU-260081 to STU-260099)
    ("Tadewos", "Abebe", "STU-260081"),
    ("Blen", "Asmamaw", "STU-260082"),
    ("Jerusalem", "Molla", "STU-260083"),
    ("Yordanos", "Ayechew", "STU-260084"),
    ("Natanem", "Amanuel", "STU-260085"),
    ("Surafel", "Andarge", "STU-260086"),
    ("Pawlos", "Birhanu", "STU-260087"),
    ("Absalaat", "Alelegn", "STU-260088"),
    ("Saba", "Desalegn", "STU-260089"),
    ("Zakarias", "Abush", "STU-260090"),
    ("Nuhamin", "Merkebu", "STU-260091"),
    ("Edom", "Setegn", "STU-260092"),
    ("Kibru LeAb", "Wasihun", "STU-260093"),
    ("Samrawit", "Getu", "STU-260094"),
    ("Meseret", "Birhanu", "STU-260095"),
    ("Yoseph", "Andinet", "STU-260096"),
    ("Betlehem", "Tamirat", "STU-260097"),
    ("Maryam Awit", "Habtamu", "STU-260098"),
    ("Mahlet", "Kibrom", "STU-260099"),

    # Batch 4 Students (STU-260100 to STU-260119)
    ("Arsema", "Birhanu", "STU-260100"),
    ("Saron", "Asfaw", "STU-260101"),
    ("Etsubdink", "Tamrat", "STU-260102"),
    ("Yordanos", "T/Maryam", "STU-260103"),
    ("Atnasya", "Atnafu", "STU-260104"),
    ("Solomon", "Zemene", "STU-260105"),
    ("Ruth", "Chalachew", "STU-260106"),
    ("Henok", "Demeke", "STU-260107"),
    ("Netsanet", "Feleke", "STU-260108"),
    ("Yohans", "T/Mariyam", "STU-260109"),
    ("Hilina", "Dawit", "STU-260110"),
    ("Tigist", "Eyayaw", "STU-260111"),
    ("Ashenafi", "Muluneh", "STU-260112"),
    ("Natnael", "Abebe", "STU-260113"),
    ("Kidus", "Melaku", "STU-260114"),
    ("Biruk", "Mekashaw", "STU-260115"),
    ("Bereket", "Birhanu", "STU-260116"),
    ("Yabsra", "Haylu", "STU-260117"),
    ("Mahilet", "Liul", "STU-260118"),
    ("Eyerusalem", "Berihun", "STU-260119"),
]

students_data = []
for (first_name, last_name, student_id) in students_raw:
    clean_first = first_name.strip()
    clean_last = last_name.strip()
    clean_first_user = clean_first.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '')
    clean_last_user = clean_last.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '')
    username = f"{clean_first_user}.{clean_last_user}"
    email = f"{clean_first_user}.{clean_last_user}@student.com"

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

    student = User.objects.filter(student_id=stu_id).first()
    if not student:
        student = User.objects.filter(username=data['username']).first()
    if not student:
        student = User.objects.filter(first_name__iexact=data['first_name'], last_name__iexact=data['last_name']).first()

    if not student:
        student = User(
            username=data['username'],
            role='student',
            student_id=stu_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            photo_url=photo or '',
            is_active=True,
        )
        student.set_password(secrets.token_urlsafe(32))
        student.save()
        print(f"✓ Created student: {student.get_full_name()} (ID: {student.student_id}, First Name: {student.first_name})")
    else:
        student.first_name = data['first_name']
        student.last_name = data['last_name']
        student.student_id = stu_id
        student.username = data['username']
        student.email = data['email']
        student.role = 'student'
        student.is_active = True
        if photo:
            student.photo_url = photo
        student.save()
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
    'MATH201': students,
    'ENG102': students,
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
