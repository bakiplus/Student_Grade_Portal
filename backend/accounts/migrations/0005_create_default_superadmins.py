from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_or_update_superadmins(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    superadmins = [
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

    for data in superadmins:
        user, _ = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        user.email = data['email']
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.role = 'admin'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.password = make_password(data['password'])
        user.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_alter_user_role'),
    ]

    operations = [
        migrations.RunPython(create_or_update_superadmins, reverse_code=noop),
    ]
