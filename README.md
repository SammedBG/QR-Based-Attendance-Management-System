# QR-Based-Attendance-Management-System

A QR code-based attendance system built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- User authentication (Student and Teacher roles)
- QR code generation for attendance sessions
- QR code scanning for marking attendance
- Attendance tracking and reporting
- Course management
- Session management
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register as a teacher or student
3. Login with your credentials

### For Teachers:
- Create courses
- Generate QR codes for attendance sessions
- View attendance records
- Manage sessions

### For Students:
- Scan QR codes to mark attendance
- View attendance history
- View enrolled courses

## Deployment

### Backend Deployment
1. Set the `NODE_ENV` environment variable to `production`
2. Build the frontend: `cd frontend && npm run build`
3. Deploy the backend to your preferred hosting service (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the build folder to your preferred hosting service (Netlify, Vercel, etc.)

## License

This project is licensed under the MIT License.
```

This completes our MERN stack implementation of the QR code attendance system. The system includes:

1. Backend:
   - Express.js server
   - MongoDB database with Mongoose
   - JWT authentication
   - RESTful API endpoints

2. Frontend:
   - React application
   - React Router for navigation
   - Context API for state management
   - Bootstrap for styling
   - QR code generation and scanning
   - Also security

The application allows teachers to create courses, generate QR codes for attendance sessions, and view attendance records. Students can scan QR codes to mark their attendance and view their attendance history.
