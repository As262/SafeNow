# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_emergencycontact'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_helper',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='helper_available',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='user',
            name='helper_skills',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='user',
            name='helper_radius_km',
            field=models.IntegerField(default=5),
        ),
    ]
