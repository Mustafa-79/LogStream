# JWT Authentication Implementation

## Backend (API Gateway)

### Middleware
- **File**: `src/middlewares/auth.ts`
- **Functions**:
  - `authenticateJWT`: Verifies JWT tokens and adds user data to request
  - `requireAdmin`: Ensures user has admin privileges
  - `optionalAuth`: Optionally adds user data if token is present

### Protected Routes
All API routes now require JWT authentication except:
- `/api/auth/*` (authentication endpoints)
- `/api/health` (health check)

Admin-only operations:
- Creating, updating, deleting applications
- Managing user groups
- Viewing all users

### Usage
```typescript
// Apply to all routes in a router
router.use(authenticateJWT);

// Require admin access for specific route
router.post('/', requireAdmin, handler);
```

## Frontend (VDOM)

### Authentication Manager
- **File**: `src/utils/auth.ts`
- **Changes**: 
  - Removed user profile storage in sessionStorage
  - Only stores `auth_token` 
  - User profile is derived from JWT token payload

### API Requests
- All API calls now include `Authorization: Bearer <token>` header
- Application service updated to use authenticated headers
- Automatic logout on 401 responses

### Session Storage
- **Before**: `auth_token` + `user_profile`
- **After**: `auth_token` only
- User data is extracted from JWT payload when needed

## Environment Variables

Ensure `JWT_SECRET` is set in the API gateway `.env` file:
```
JWT_SECRET=your-secret-key-here
```

## Security Features

1. **Token Validation**: Verifies JWT signature and expiration
2. **Role-Based Access**: Admin-only operations protected
3. **Automatic Logout**: Invalid tokens trigger logout
4. **Secure Headers**: All API requests include authentication headers
5. **Domain Restriction**: Only `@gosaas.io` emails allowed (in auth controller)

## Testing

To test JWT authentication:
1. Start the API gateway
2. Start the frontend
3. Login with Google OAuth
4. Try accessing protected endpoints
5. Check that 401/403 responses are handled correctly
