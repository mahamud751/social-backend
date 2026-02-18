# Backend FCM Setup Instructions

## Step 1: Install Firebase Admin SDK

```bash
cd savasschi-backend
npm install firebase-admin
```

## Step 2: Initialize Firebase Admin

Create `src/fcm/firebase-admin.ts`:

```typescript
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase-service-account.json'; // Download from Firebase Console

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
```

**How to get `firebase-service-account.json`:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file → save as `src/fcm/firebase-service-account.json`
4. Add to `.gitignore` (contains secrets!)

## Step 3: Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model UserFcmToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String?  // 'android' | 'ios'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Then run:
```bash
npx prisma migrate dev --name add_user_fcm_token
```

## Step 4: Update FCM Service

In `src/fcm/fcm.service.ts`, uncomment the Firebase Admin code (remove `//` comments).

## Step 5: Create API Endpoint to Register FCM Token

In `src/users/users.controller.ts`:

```typescript
import { FcmService } from '../fcm/fcm.service';

@Post('fcm-token')
async registerFcmToken(
  @Body() body: { token: string; platform?: string },
  @CurrentUser() user: CurrentUserDto,
) {
  await this.fcmService.registerToken(user.id, body.token, body.platform);
  return { success: true };
}
```

## Step 6: Test

1. User logs in → app calls `POST /users/fcm-token` with token
2. Another user calls → if callee is offline → backend sends FCM
3. Callee's phone receives push → app wakes → shows incoming call UI
