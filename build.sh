#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Step into the backend folder
cd core_api

# 3. Collect static files for whitenoise
python manage.py collectstatic --no-input

# 4. Run migrations
python manage.py migrate

# 5. Create a default Superuser automatically (if it doesn't exist)
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@example.com
export DJANGO_SUPERUSER_PASSWORD=hackathon123

python manage.py createsuperuser --noinput || true

# 6. Force reset password to 'hackathon123' to prevent lockouts on Free Tier
python manage.py shell < reset_admin.py