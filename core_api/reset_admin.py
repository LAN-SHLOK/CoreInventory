from django.contrib.auth.models import User

user = User.objects.filter(username='admin').first()
if user:
    user.set_password('hackathon123')
    user.save()
    print("--- Admin password forced to 'hackathon123' ---")
else:
    User.objects.create_superuser('admin', 'admin@example.com', 'hackathon123')
    print("--- Admin superuser created successfully ---")
