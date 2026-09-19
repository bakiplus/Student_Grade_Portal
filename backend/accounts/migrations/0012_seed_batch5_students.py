import secrets
from django.db import migrations
from django.contrib.auth.hashers import make_password


BATCH_5_STUDENTS = [
    ("Philimon", "G/Wahid", "STU-260120"),
    ("Sipara", "Matiwos", "STU-260121"),
    ("Yalemwork", "Masresha", "STU-260122"),
    ("Selome", "Alemeshet", "STU-260123"),
    ("Tewodros", "Berihun", "STU-260124"),
    ("Forehiwot", "Setegn", "STU-260125"),
    ("Aster", "Yemataw", "STU-260126"),
    ("Hiwot", "Adane", "STU-260127"),
    ("Abeba", "Yigzaw", "STU-260128"),
    ("Rahel", "Mekashaw", "STU-260129"),
    ("Mulunesh", "Eyayu", "STU-260130"),
    ("Kidusan", "Azanaw", "STU-260131"),
    ("Nardos", "Shumet", "STU-260132"),
    ("Helen", "Atanaw", "STU-260133"),
    ("Moses", "Birhanu", "STU-260134"),
    ("Dagmawit", "Yohans", "STU-260135"),
    ("Eden", "Chalachew", "STU-260136"),
    ("Meron", "Yalew", "STU-260137"),
    ("Hana", "Getachew", "STU-260138"),
    ("Etsubdink", "Fentahun", "STU-260139"),
    ("Meseret", "Amsal", "STU-260140"),
    ("Abiy", "Berihun", "STU-260141"),
    ("Efrem", "Zinaw", "STU-260142"),
    ("Samuel", "Adugna", "STU-260143"),
    ("Biruk", "Tenaw", "STU-260144"),
    ("Getachew", "Fente", "STU-260145"),
    ("Betelhem", "Takele", "STU-260146"),
    ("Betelhem", "Belay", "STU-260147"),
]


def seed_batch5_students(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    for first_name, last_name, student_id in BATCH_5_STUDENTS:
        clean_first = first_name.strip()
        clean_last = last_name.strip()
        clean_first_user = clean_first.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '').replace('.', '')
        clean_last_user = clean_last.lower().replace(' ', '').replace("'", "").replace("’", "").replace('/', '').replace('.', '')
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
        ('accounts', '0011_seed_batch4_students'),
    ]

    operations = [
        migrations.RunPython(seed_batch5_students, reverse_code=noop),
    ]
