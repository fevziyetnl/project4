# Generated by Django 3.8.6 on 2021-08-31 17:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='post',
            old_name='likes',
            new_name='liked_by',
        ),
    ]