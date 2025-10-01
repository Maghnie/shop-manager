# GitHub Actions CI/CD Setup

This directory contains GitHub Actions workflows for automated testing.

## Workflow: `tests.yml`

### Overview
Automatically runs all backend and frontend tests on every push and pull request.

### What It Does

**Backend Tests:**
- Sets up Python 3.12
- Launches PostgreSQL 15 database service
- Installs Django and all dependencies
- Runs all Django tests across all apps (`sales`, `inventory`, `analytics`, etc.)
- Uses `--parallel` flag for faster execution

**Frontend Tests:**
- Sets up Node.js 20
- Installs all npm dependencies
- Runs all Vitest unit tests
- Uploads coverage reports as artifacts

### Triggers
- ✅ Every push to any branch
- ✅ Pull requests targeting `main` or `develop`

### Environment Variables Used

The workflow sets these environment variables for Django:
- `POSTGRES_DB`: test_shop_db
- `POSTGRES_USER`: postgres
- `POSTGRES_PASSWORD`: postgres
- `DB_HOST`: localhost
- `DB_PORT`: 5432
- `DJANGO_SECRET_KEY`: test-secret-key-for-ci
- `DEBUG`: False

### Dependencies

**Backend:**
- All packages in `backend/requirements.txt`
- `psycopg2-binary` (installed separately for PostgreSQL support)

**Frontend:**
- All packages in `frontend/package.json` (locked via `package-lock.json`)

### First-Time Setup

**Option 1: Use default test key (Quick start)**
The workflow will work immediately with a fallback test key. No setup needed!

**Option 2: Use GitHub secrets (Recommended)**
For better security, set up a GitHub secret:

1. Generate a secret key:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

2. Add it to GitHub:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `DJANGO_SECRET_KEY`
   - Value: (paste the generated key)
   - Click **Add secret**

3. The workflow will automatically use this secret instead of the fallback

### Viewing Results

After pushing code:
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Select the latest workflow run
4. View test results for backend and frontend jobs

### Local Testing

To run the same tests locally before pushing:

```bash
# Backend tests
cd backend
python manage.py test --parallel --keepdb

# Frontend tests
cd frontend
npm run test:run
```

### Troubleshooting

**If backend tests fail:**
- Check that `backend/requirements.txt` includes all necessary packages
- Verify Django settings in `backend/backend/settings.py`
- Ensure migrations are up to date

**If frontend tests fail:**
- Check that `frontend/package-lock.json` is committed
- Verify test files are in `frontend/src/apps/*/tests/`
- Run `npm run test:run` locally to reproduce

### Adding New Apps

The workflow automatically discovers and runs tests in new Django apps and frontend test files. No workflow changes needed!

**Django Apps:**
- Just add tests to `<app>/tests.py` or `<app>/tests/`
- Django's test runner will find them automatically

**Frontend:**
- Add test files matching `**/*.test.ts` or `**/*.test.tsx`
- Vitest will discover them automatically

### Performance

- **Caching**: The workflow caches pip packages and npm modules to speed up subsequent runs
- **Parallel Tests**: Backend tests run in parallel when possible
- **Average Runtime**: ~2-3 minutes for both jobs combined
