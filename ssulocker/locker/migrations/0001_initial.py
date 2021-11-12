# Generated by Django 3.2.9 on 2021-11-12 15:01

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='locker',
            fields=[
                ('lockernum', models.IntegerField(primary_key=True, serialize=False)),
                ('floor', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='personalinfo',
            fields=[
                ('name', models.CharField(help_text='이름', max_length=10)),
                ('id', models.CharField(help_text='학번', max_length=8, primary_key=True, serialize=False)),
                ('pw', models.CharField(max_length=20)),
                ('lockernum', models.IntegerField()),
                ('department', models.CharField(choices=[('cs', '컴퓨터학부'), ('GM', '글로벌미디어학부'), ('EIE', '전자정보공학부'), ('SW', '소프트웨어학부'), ('AIC', 'AI융합학부')], max_length=4)),
            ],
        ),
    ]
