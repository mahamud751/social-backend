# Social Backend - LinkMeet

NestJS backend for the Social App (LinkMeet) with PostgreSQL database.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (running locally or remote)
- npm or yarn

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env` file (already exists)
   - Update `DATABASE_URL` if needed
   - Update `JWT_SECRET` for production

3. **Set up database:**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. **Start the server:**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will run on `http://localhost:8080` (or the PORT specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile (requires auth)
- `PUT /api/users/me` - Update profile (requires auth)
- `PUT /api/users/me/status` - Update status (requires auth)

### Chats (1-to-1)
- `GET /api/chats` - Get chat list (requires auth)
- `GET /api/chats/:userId/messages` - Get messages with a user (requires auth)
- `POST /api/chats/:userId/messages` - Send message (requires auth)

### Groups
- `GET /api/groups` - Get user's groups (requires auth)
- `POST /api/groups` - Create a group (requires auth)
- `GET /api/groups/:id` - Get group info (requires auth)
- `GET /api/groups/:id/messages` - Get group messages (requires auth)
- `POST /api/groups/:id/messages` - Send group message (requires auth)

### Meetings
- `GET /api/meetings` - Get user's meetings (requires auth)
- `POST /api/meetings` - Create a meeting (requires auth)
- `POST /api/meetings/join` - Join a meeting by code (requires auth)

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

Main models:
- `User` - User accounts
- `Message` - 1-to-1 messages
- `ChatGroup` - Group chats
- `GroupMessage` - Group messages
- `Meeting` - Meetings
- `CallLog` - Call history

## Development

- Prisma Studio: `npm run prisma:studio` - Visual database browser
- Linting: `npm run lint`
- Formatting: `npm run format`

## Notes

- All endpoints except `/api/auth/*` require JWT authentication
- JWT token should be sent in `Authorization: Bearer <token>` header
- Token expires in 7 days
