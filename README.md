# Club Ticketing System (CMTS)

A full-stack web application designed to manage free tickets, verify identities, and handle memberships for the official supporters group. 

## Tech Stack
* **Frontend:** React.js (React Router, custom CSS)
* **Backend:** Node.js, Express.js
* **Database:** MySQL

## Prerequisites
Before running the project locally, ensure you have the following installed:
* [Node.js](https://nodejs.org/)
* [XAMPP](https://www.apachefriends.org/) (for the MySQL database server)
* Git Bash

## 1. Database Setup
1. Open XAMPP and start the **MySQL** and **Apache** modules.
2. Open your browser and navigate to `http://localhost/phpmyadmin`.
3. Create a new database named `club_ticketing`.
4. Import the `schema.sql` file located in the project files to generate the `users`, `attendance_log`, `events`, `tickets`, and `contact_messages` tables.

## 2. Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd club-ticketing-backend


   Install the required dependencies:

Bash
npm install
Ensure your .env file is present and configured correctly:

Code snippet
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=club_ticketing
Start the backend development server:

Bash
npm run dev
The API will run on http://localhost:5000

3. Frontend Setup
Open a new terminal window and navigate to the frontend folder:

Bash
cd club-ticketing-frontend
Install the React dependencies:

Bash
npm install
Start the React development server:

Bash
npm start
The user interface will automatically open in your browser at http://localhost:3000
