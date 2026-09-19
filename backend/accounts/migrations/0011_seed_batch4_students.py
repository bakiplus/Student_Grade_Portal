import secrets
from django.db import migrations
from django.contrib.auth.hashers import make_password


BATCH_4_STUDENTS = [
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


def seed_batch4_students(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    for first_name, last_name, student_id in BATCH_4_STUDENTS:
        clean_first = first_name.strip()
        clean_last = last_name.strip()
        clean_first_user = clean_first.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '')
        clean_last_user = clean_last.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '')
        username = f"{clean_first_user}.{clean_last_user}"
        email = f"{clean_first_user}.{clean_last_user}@student.com"

        user = User.objects.filter(student_id=student_id).first()
        if not user:
            user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.filter(first_name__iexact=clean_first, last_name__iexact=clean_last).first()

        if not user:
            user = User(
                username=username,
                first_name=clean_first,
                last_name=clean_last,
                email=email,
                password=make_password(secrets.token_urlsafe(32)),
                role='student',
                student_id=student_id,
                photo_url='',
                is_staff=False,
                is_superuser=False,
                is_active=True,
            )
            user.save()
        else:
            user.first_name = clean_first
            user.last_name = clean_last
            user.username = username
            user.email = email
            user.role = 'student'
            user.student_id = student_id
            user.is_active = True
            if not user.password:
                user.password = make_password(secrets.token_urlsafe(32))
            user.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_seed_batch3_students'),
    ]

    operations = [
        migrations.RunPython(seed_batch4_students, reverse_code=noop),
    ]
