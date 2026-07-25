# LeadDesk Mini

A simple lead-capture application with a public contact form, SQLite database, and a secure admin dashboard for managing customer enquiries. This project was built as part of the Digital Heroes Full Stack Development internship assignment.

---

## Live Demo

**Application:** https://digitalheroes-y5e4.onrender.com/

**Admin Dashboard:** https://digitalheroes-y5e4.onrender.com/admin/login.html

---

## Tech Stack

### Backend

- Node.js
- Express.js

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Database

- SQLite (Node.js built-in `node:sqlite`)

### Authentication

- express-session
- bcryptjs

---

## Features

- Public lead submission form
- Client-side and server-side validation
- Secure admin login
- Session-based authentication
- View all submitted leads
- Search leads by name, email, or message
- Update lead status (New → Contacted → Closed)
- Delete leads
- Export all leads as CSV
- Responsive admin dashboard

---

## Database Schema

### Leads Table

```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    budget_range TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Admins Table

```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);
```

---

## Authentication

The application uses server-side session authentication with **express-session**.

Passwords are securely hashed using **bcryptjs** before being stored in the database.

Every admin API route is protected using authentication middleware to ensure that only logged-in administrators can access or modify lead data.

---

## Project Structure

```
LeadDesk-Mini
│
├── public/
│   ├── admin/
│   ├── css/
│   ├── js/
│   └── index.html
│
├── db.js
├── server.js
├── seed.js
├── package.json
├── leaddesk.db
└── README.md
```

---

## Running Locally

Clone the repository.

```bash
git clone https://github.com/AvinashRasala/Digital-Heroes
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
SESSION_SECRET=your_secret_key
SETUP_SECRET=your_setup_secret
```

Seed the admin account.

```bash
npm run seed
```

Start the application.

```bash
npm start
```

Visit:

```
http://localhost:3000
```

Admin Dashboard:

```
http://localhost:3000/admin
```

---

## Deployment

The application is deployed on Render.

Environment variables used:

- ADMIN_USERNAME
- ADMIN_PASSWORD
- SESSION_SECRET
- SETUP_SECRET

SQLite database is stored on a persistent disk.

---

## Improvements Made

During development I made several improvements to the project, including:

- Added the missing DELETE API endpoint for removing leads.
- Fixed backend routing issues.
- Improved the admin dashboard functionality.
- Customized the user interface and project content.
- Tested all CRUD operations after deployment.

---

## Future Improvements

- Rate limiting for form submissions
- Pagination for large numbers of leads
- Email notifications for new leads
- CSRF protection
- PostgreSQL support
- Role-based authentication
- Dashboard analytics

---

## AI Use Disclosure

I used AI as a development assistant throughout this project to better understand the existing codebase, debug backend API issues, and explain implementation details. AI helped identify a missing DELETE API endpoint, understand Express.js routing, troubleshoot deployment issues, and explain how different parts of the application work.

I personally reviewed every AI suggestion before applying it, implemented the required backend changes, tested the application locally and after deployment, and verified that all major features—including lead submission, authentication, lead status updates, lead deletion, searching, and CSV export—worked correctly. I also customized the project by updating the interface and application content. AI accelerated the debugging and learning process, while I remained responsible for implementing, testing, and submitting the final solution.

---

## Author

**Avinash Rasala**

GitHub:
https://github.com/AvinashRasala/Digital-Heroes

Live Demo:
https://digitalheroes-y5e4.onrender.com/
