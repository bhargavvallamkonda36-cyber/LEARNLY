# Learnly — current update

## Fixed

- Unified frontend authentication storage with `learnly_access_token`.
- Login now clears stale legacy token keys before storing the new JWT.
- Legacy `access_token`, `token`, `auth_token`, `accessToken`, and `jwt` values are migrated safely.
- Student/instructor API services now send the same JWT.
- 401 responses clear the session instead of continuing with a broken token.
- Added missing instructor course routes:
  - `/instructor/courses/create`
  - `/instructor/courses/:courseId`
  - `/instructor/courses/:courseId/builder`
  - `/instructor/courses/:courseId/edit`
- Added instructor course edit page.
- Added backend `PUT /api/v1/courses/{course_id}`.
- Added backend `DELETE /api/v1/courses/{course_id}`.
- Backend `.env` loading now works when uvicorn is started from `backend/`.
- Frontend `.env` now uses `VITE_API_BASE_URL` consistently.
- Removed the exposed Groq API key from the project copy. Add your own key to `.env` before using Groq AI.
- Normalized `backend/requirements.txt` to UTF-8.
- Added backend API smoke tests in `backend/tests/test_smoke.py`.
- Added final manual testing checklist in `TESTING.md`.

## Static validation completed

- Backend Python source compiled successfully.
- Frontend JavaScript/JSX source parsed successfully.
- Frontend relative imports were checked successfully.

## Not executed in this Linux build environment

- Windows Vite production build, because the uploaded `node_modules` contains Windows-native dependencies.
- Live FastAPI smoke tests, because this environment does not have the uploaded Windows virtual environment's native Python dependencies.

Run the commands in `TESTING.md` on your Windows machine for final live testing.
