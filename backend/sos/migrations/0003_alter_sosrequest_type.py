# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sos', '0002_alter_sosrequest_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sosrequest',
            name='type',
            field=models.CharField(choices=[('Police', 'Police'), ('Fire Emergency', 'Fire Emergency'), ('Medical Help', 'Medical Help'), ('NGO Support', 'NGO Support')], max_length=50),
        ),
    ]
