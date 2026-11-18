# Hiring Portal – Job Application Management System

A full-stack web application designed to simplify recruitment by allowing candidates to explore job opportunities, submit applications, and track their application status while HR teams manage job postings and recruitment workflows.

## Tech Stack

**Frontend:** React.js, Vite, Tailwind CSS, Axios, React Router

**Backend:** Python, Django, Django REST Framework

**Database:** PostgreSQL

**Authentication:** JWT (HR users only)

**Additional Features:** Resume uploads, email notifications, application tracking

## Features

### Candidate Portal
- Browse published job opportunities.
- Search available jobs.
- View job descriptions and requirements.
- Apply for jobs using a resume (PDF/DOCX, maximum 5 MB).
- Receive a unique application tracking ID.
- Track application status using tracking ID and email.
- Receive email notifications for application submission and status changes.
- No registration or login required.

### HR Portal
- Secure JWT-based HR login.
- View dashboard statistics.
- Create and manage job postings.
- View and search candidate applications.
- Filter applicants by application status.
- View and download uploaded resumes.
- Update application statuses.
- Add candidate-visible notes and internal HR notes.
- Manage the recruitment workflow.

## Application Status Workflow

Applied → Under Review → Shortlisted / On Hold → Selected / Rejected

## Project Structure

```text
Hiring-Portal/
├── backend/
│   └── config/
│       ├── accounts/
│       ├── applications/
│       ├── jobs/
│       ├── config/
│       └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── .gitignore
└── README.md
```

## Installation and Setup

### Backend

1. Clone the repository.

```bash
git clone https://github.com/Payalshirbhate/Hiring_Portal.git
cd Hiring_Portal/backend/config
```

2. Create and activate a virtual environment.

```bash
python -m venv venv
venv\Scripts\activate
```

3. Install backend dependencies.

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv Pillow
```

4. Configure PostgreSQL, Django secret settings, and email credentials using environment variables. Do not commit actual credentials.

5. Run database migrations.

```bash
python manage.py migrate
```

6. Start the Django development server.

```bash
python manage.py runserver
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Backend runs at `http://127.0.0.1:8000`.

## Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs/` | List available jobs |
| POST | `/api/jobs/` | Create a job (HR) |
| GET | `/api/jobs/<id>/` | View job details |
| POST | `/api/applications/` | Submit application |
| POST | `/api/track/` | Track application |
| POST | `/api/hr/login/` | HR login |
| GET | `/api/hr/applications/` | View applicants (HR) |
| PATCH | `/api/hr/applications/<id>/status/` | Update application status (HR) |
| GET | `/api/hr/applications/<id>/resume/` | Download resume (HR) |

## Security

- JWT authentication for HR users.
- Role-based access control for protected endpoints.
- Application tracking requires a matching tracking ID and email.
- Internal HR notes are excluded from candidate tracking responses.
- Resume download endpoint requires HR authentication.
- Environment variables and uploaded files should be excluded from version control.

**Deployment note:** Resume storage must be configured as private storage to prevent access through public media URLs.

## Testing

The application was tested using Postman and frontend workflow testing, covering:

- Job creation and retrieval
- Candidate application submission
- Duplicate application validation
- Application tracking
- HR login and authorization
- Status updates
- Email notifications
- Resume download authorization
- Responsive frontend layouts

## Future Enhancements

- Advanced candidate filtering
- Interview scheduling
- Application analytics and reports
- Pagination for large applicant lists
- Production deployment with private cloud file storage

## Project Repository

https://github.com/Payalshirbhate/Hiring_Portal

## Developer

Payal Shirbhate

Full Stack Developer
