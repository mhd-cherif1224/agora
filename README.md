# Mini-Projet

## Overview

Mini-Projet is a web application designed to facilitate service exchanges between students and teachers. It provides user registration, authentication, service listing, and administrative management features.

## Key Features

- User and admin login flows
- Service creation, viewing, and management
- Category management for organizing services
- User management for administrators
- Responsive interface with separate user and admin views

## Project Structure

- `Controller/` — PHP action handlers for authentication, service, category, and user operations
- `model/` — Data models and database access classes
- `view/` — Front-end templates, styles, and client-side scripts
- `utilities/` — Support utilities such as email verification and messaging

## Setup

1. Place the project in a PHP-enabled web server root (e.g. WAMP).
2. Configure the database connection in `model/Database.php`.
3. Import the required SQL schema if available.
4. Open the application in your browser and use the provided login/signup pages.
5. change the api in emailVerifaction.php, to an api you create in resend.com

## Notes

- Ensure PHP and MySQL are installed and running.
- Verify file permissions for session handling and uploads if needed.
- Customize database credentials before first use.

