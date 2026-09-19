import secrets
from django.db import migrations
from django.contrib.auth.hashers import make_password


NEW_STUDENTS = [
    ("Rakeb", "Tesfaye"),
    ("Etsgenet", "Tesfaye"),
    ("Mahlet", "Solomon"),
    ("Be'Emnet", "Kendu"),
    ("Makda", "Getaneh"),
    ("Salome", "Asemaraw"),
    ("Bezawit", "Birhane"),
    ("Rodas", "Abebe"),
    ("Edom", "Mulualem"),
    ("Yemisirach", "Baya"),
    ("Melos", "Yigzaw"),
    ("Nuamin", "Melaku"),
    ("Absalat", "Selamsew"),
    ("Yabsira", "Dawit"),
    ("Philemon", "Fasil"),
    ("Abel", "Sigtetaw"),
    ("Daniel", "Yoseph"),
    ("Yoseph", "Marshet"),
    ("Surafel", "Dejen"),
    ("Yonatan", "Abiy"),
]


def seed_new_students(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    # Release any existing student_ids STU-260001 through STU-260099
    # so we can reassign cleanly without unique constraint violation
    for student in User.objects.filter(student_id__startswith='STU-26'):
        student.student_id = None
        student.save()

    for index, (first_name, last_name) in enumerate(NEW_STUDENTS, start=1):
        clean_first = first_name.strip()
        clean_last = last_name.strip()
        student_id = f"STU-26{index:04d}"

        clean_first_user = clean_first.lower().replace(' ', '').replace("'", "").replace("’", "")
        clean_last_user = clean_last.lower().replace(' ', '').replace("'", "").replace("’", "")
        username = f"{clean_first_user}.{clean_last_user}"
        email = f"{clean_first_user}.{clean_last_user}@student.com"

        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.filter(first_name=clean_first, last_name=clean_last).first()

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
        ('accounts', '0007_clear_dicebear_avatars'),
    ]

    operations = [
        migrations.RunPython(seed_new_students, reverse_code=noop),
    ]
