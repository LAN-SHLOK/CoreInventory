#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Step into the backend folder and run migrations
cd core_api
python manage.py migrate

# 3. Create a default Superuser automatically (if it doesn't exist)
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@example.com
export DJANGO_SUPERUSER_PASSWORD=hackathon123

python manage.py createsuperuser --noinput || true