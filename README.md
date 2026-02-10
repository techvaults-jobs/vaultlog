# VaultLog

A comprehensive task and time tracking system for managing client projects, tasks, and team productivity.

## Features

- **Task Management**: Create, assign, and track tasks with priority levels and status updates
- **Time Logging**: Log billable and non-billable hours against tasks
- **Client Management**: Organize tasks by client with status tracking
- **Role-Based Access**: Admin, Manager, and Staff roles with appropriate permissions
- **Activity Audit Trail**: Immutable logs of all system activities
- **File Attachments**: Upload and manage task-related files
- **Real-time Dashboard**: Monitor project progress and team workload

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js with bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:
```
DATABASE_URL=your_neon_database_url
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run seed` - Seed database with sample data

## Default Credentials

After seeding, use these credentials to log in:

- **Admin**: techvaults@gmail.com / 95R(nR1'>eA~"4-9m8\s£1"lUfy/Vq)0Ge@W
- **Manager**: manager@vaultlog.local / manager123
- **Staff**: alice@vaultlog.local / staff123

## Database Schema

- **Users**: Team members with role-based access
- **Clients**: Client organizations
- **Tasks**: Project tasks with assignments and status tracking
- **Time Logs**: Billable and non-billable time entries
- **Activity Logs**: Immutable audit trail
- **Attachments**: Task-related file uploads
