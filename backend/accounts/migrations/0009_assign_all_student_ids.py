from django.db import migrations


ORDERED_STUDENTS = [
    # 1. Original 31 Students + Athnasiya (STU-260001 to STU-260032)
    ("Nuhamin", "Abraham", "nuhamin.abraham"),
    ("Nuhamin", "Selamu", "nuhamin.selamu"),
    ("Nuhamin", "Bekele", "nuhamin.bekele"),
    ("Betelhem", "Dese", "betelhem.dese"),
    ("Betemariam", "Matewos", "betemariam.matewos"),
    ("Nebiyu", "Samuel", "nebiyu.samuel"),
    ("Yostena", "Marshet", "yostena.marshet"),
    ("Tinsae", "Melaku", "tinsae.melaku"),
    ("Eyasu", "Melkamu", "eyasu.melkamu"),
    ("Hana", "Amare", "hana.amare"),
    ("Sosina", "Solomon", "sosina.solomon"),
    ("Hermela", "Tariku", "hermela.tariku"),
    ("Mekdes", "Daniel", "mekdes.daniel"),
    ("Eldana", "Amene", "eldana.amene"),
    ("Kiber", "Yilkal", "kiber.yilkal"),
    ("Yonas", "Asfaw", "yonas.asfaw"),
    ("Tebarek", "Solomon", "tebarek.solomon"),
    ("Dagim", "Fiseha", "dagim.fiseha"),
    ("Yohannes", "Fiseha", "yohannes.fiseha"),
    ("Elias", "Birhanu", "elias.birhanu"),
    ("Kirubel", "Asefa", "kirubel.asefa"),
    ("Beanchi", "Amlak Molla", "beanchi.amlakmolla"),
    ("Danawit", "Fentahun", "danawit.fentahun"),
    ("Nardos", "Atanaw", "nardos.atanaw"),
    ("Mihret", "Asemaraw", "mihret.asemaraw"),
    ("Meron", "Tefera", "meron.tefera"),
    ("Roza", "Muluqen", "roza.muluqen"),
    ("Eitsubdink", "Dawit", "eitsubdink.dawit"),
    ("Yeabsira", "Andargachew", "yeabsira.andargachew"),
    ("Tsion", "Melaku", "tsion.melaku"),
    ("Elsabet", "Amare", "elsabet.amare"),
    ("Athnasiya", "Tizazu", "athnasiya.tizazu"),

    # 2. Continued 20 Students (STU-260033 to STU-260052)
    ("Rakeb", "Tesfaye", "rakeb.tesfaye"),
    ("Etsgenet", "Tesfaye", "etsgenet.tesfaye"),
    ("Mahlet", "Solomon", "mahlet.solomon"),
    ("Be'Emnet", "Kendu", "beemnet.kendu"),
    ("Makda", "Getaneh", "makda.getaneh"),
    ("Salome", "Asemaraw", "salome.asemaraw"),
    ("Bezawit", "Birhane", "bezawit.birhane"),
    ("Rodas", "Abebe", "rodas.abebe"),
    ("Edom", "Mulualem", "edom.mulualem"),
    ("Yemisirach", "Baya", "yemisirach.baya"),
    ("Melos", "Yigzaw", "melos.yigzaw"),
    ("Nuamin", "Melaku", "nuamin.melaku"),
    ("Absalat", "Selamsew", "absalat.selamsew"),
    ("Yabsira", "Dawit", "yabsira.dawit"),
    ("Philemon", "Fasil", "philemon.fasil"),
    ("Abel", "Sigtetaw", "abel.sigtetaw"),
    ("Daniel", "Yoseph", "daniel.yoseph"),
    ("Yoseph", "Marshet", "yoseph.marshet"),
    ("Surafel", "Dejen", "surafel.dejen"),
    ("Yonatan", "Abiy", "yonatan.abiy"),
]


def assign_all_student_ids(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    # Step 1: Temporarily release all student IDs to avoid uniqueness collisions
    for student in User.objects.filter(role='student'):
        student.student_id = None
        student.save(update_fields=['student_id'])

    counter = 1

    # Step 2: Assign sequential IDs according to master order
    for first_name, last_name, username in ORDERED_STUDENTS:
        student_id = f"STU-26{counter:04d}"

        # Find student by username or name
        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.filter(first_name__iexact=first_name, last_name__iexact=last_name).first()

        if user:
            user.student_id = student_id
            user.role = 'student'
            user.is_active = True
            user.save(update_fields=['student_id', 'role', 'is_active'])
            counter += 1

    # Step 3: Any remaining student accounts in database get next available IDs
    for extra_student in User.objects.filter(role='student', student_id__isnull=True).order_by('last_name', 'first_name'):
        extra_student.student_id = f"STU-26{counter:04d}"
        extra_student.save(update_fields=['student_id'])
        counter += 1


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_seed_new_students'),
    ]

    operations = [
        migrations.RunPython(assign_all_student_ids, reverse_code=noop),
    ]
