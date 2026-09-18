from django.db import migrations


def clear_dicebear_avatars(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Clear any dicebear placeholder URLs so students without uploaded photos stay blank
    User.objects.filter(photo_url__icontains='dicebear').update(photo_url='')


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_seed_students'),
    ]

    operations = [
        migrations.RunPython(clear_dicebear_avatars, reverse_code=noop),
    ]
