# Deployment

This is a Django app, so deploy it as a Python web service rather than a static site.

## Render

1. Push this repository to GitHub.
2. Create a PostgreSQL database on Render.
3. Create a Render Web Service connected to the repository.
4. Use these settings:
   - Build Command: `./build.sh`
   - Start Command: `gunicorn --chdir backend krishna_backend.wsgi:application`
5. Add these environment variables:
   - `DJANGO_DEBUG=0`
   - `DJANGO_SECRET_KEY=<generate a long random secret>`
   - `DJANGO_ALLOWED_HOSTS=<your-service>.onrender.com,yourdomain.com`
   - `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-service>.onrender.com,https://yourdomain.com`
   - `DATABASE_URL=<your Render PostgreSQL internal database URL>`

## Uploaded Images

Product and drop images are stored in `backend/media/` locally. On most app hosts, local files are not permanent unless you attach persistent storage.

This project enables `DJANGO_SERVE_MEDIA=1` on Render so demo uploads can be served by Django. This is acceptable for a small demo, but it is not the right long-term production setup for a real store.

For Render, attach a persistent disk if you want admin-uploaded images to survive deploys, then set:

```bash
DJANGO_MEDIA_ROOT=/path/to/persistent/media
```

For a production store with frequent image uploads, object storage such as S3, Cloudinary, or another media host is usually a better long-term choice.

## Admin Account

Set these environment variables in Render before deploying if you want the build to create or reset the admin account automatically:

```bash
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=preyanshushah@gmail.com
DJANGO_SUPERUSER_PASSWORD=<your private password>
```

The build runs `python backend/manage.py ensure_admin` after migrations.

Alternatively, after the site is deployed, open the host shell and run `python backend/manage.py createsuperuser`.

## Local Production Check

```bash
DJANGO_DEBUG=0 \
DJANGO_SECRET_KEY=replace-with-a-long-random-secret \
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1 \
python backend/manage.py check --deploy
```
