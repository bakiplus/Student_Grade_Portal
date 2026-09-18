import secrets
from django.db import migrations


def seed_students(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

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

    for index, (first_name, last_name) in enumerate(students_raw, start=1):
        clean_first = first_name.strip()
        clean_last = last_name.strip()
        student_id = f"STU-26{index:04d}"
        clean_first_user = clean_first.lower().replace(' ', '')
        clean_last_user = clean_last.lower().replace(' ', '')
        username = f"{clean_first_user}.{clean_last_user}"
        email = f"{clean_first_user}.{clean_last_user}@student.com"
        seed_name = f"{clean_first}{clean_last.replace(' ', '')}"
        photo_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed_name}"

        # Find by student_id or username
        user = User.objects.filter(student_id=student_id).first()
        if not user:
            user = User.objects.filter(username=username).first()

        if not user:
            user = User(
                username=username,
                first_name=clean_first,
                last_name=clean_last,
                email=email,
                role='student',
                student_id=student_id,
                photo_url=photo_url,
                is_staff=False,
                is_superuser=False,
                is_active=True,
            )
            user.set_unusable_password()
            user.save()
        else:
            user.first_name = clean_first
            user.last_name = clean_last
            user.role = 'student'
            user.student_id = student_id
            if not user.photo_url:
                user.photo_url = photo_url
            user.is_active = True
            user.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_create_default_superadmins'),
    ]

    operations = [
        migrations.RunPython(seed_students, reverse_code=noop),
    ]
