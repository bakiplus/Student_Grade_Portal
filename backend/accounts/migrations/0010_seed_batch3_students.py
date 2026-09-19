import secrets
from django.db import migrations
from django.contrib.auth.hashers import make_password


BATCH_3_STUDENTS = [
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
]


def seed_batch3_students(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    for first_name, last_name, student_id in BATCH_3_STUDENTS:
        clean_first = first_name.strip()
        clean_last = last_name.strip()
        clean_first_user = clean_first.lower().replace(' ', '').replace("'", "").replace("’", "")
        clean_last_user = clean_last.lower().replace(' ', '').replace("'", "").replace("’", "")
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
        ('accounts', '0009_assign_all_student_ids'),
    ]

    operations = [
        migrations.RunPython(seed_batch3_students, reverse_code=noop),
    ]
