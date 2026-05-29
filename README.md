# Krishna-Readymade

Django storefront and product dashboard for Krishna Readymade.

## Project Structure

```text
KrishnaReadymade/
├── backend/
│   ├── krishna_backend/ # Django project settings and root URLs
│   ├── store/           # Products app: models, admin, page views, APIs, URLs
│   ├── media/           # Local uploaded files, ignored by git
│   ├── db.sqlite3       # Local database, ignored by git
│   └── manage.py
├── frontend/
│   ├── static/
│   │   ├── css/        # Page and dashboard stylesheets
│   │   └── js/         # Storefront and dashboard JavaScript
│   └── templates/      # Django HTML templates
├── requirements.txt
└── README.md
```

## Local Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

## Notes

- Product images are uploaded to `backend/media/products/`.
- `backend/db.sqlite3`, `backend/media/`, `.vscode/`, and Python cache files are intentionally ignored.
- The admin product dashboard template is `frontend/templates/admin-products.html`.
- Product API endpoints and payload validation live in `backend/store/api.py`.
- Page-rendering views live in `backend/store/views.py`.

## Environment Variables

Optional local settings:

```bash
export DJANGO_SECRET_KEY="replace-me"
export DJANGO_DEBUG="1"
export DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1"
```
