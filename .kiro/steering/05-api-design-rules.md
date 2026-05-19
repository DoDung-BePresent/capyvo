# API Design Rules

## RESTful Principles

### Resource Naming

- Use plural nouns for collections (e.g., `/users`, `/questions`)
- Use kebab-case for multi-word resources (e.g., `/exam-sets`)
- Avoid verbs in URLs (use HTTP methods instead)
- Use nested routes for relationships (e.g., `/users/:id/subscriptions`)

### HTTP Methods

- **GET**: Retrieve resource(s) - idempotent, no side effects
- **POST**: Create new resource
- **PUT**: Replace entire resource
- **PATCH**: Partial update of resource
- **DELETE**: Remove resource

### Examples

```
GET    /api/questions              # List all questions
GET    /api/questions/:id          # Get single question
POST   /api/questions              # Create question
PATCH  /api/questions/:id          # Update question
DELETE /api/questions/:id          # Delete question

GET    /api/questions?partNumber=1&status=PUBLISHED  # Filtered list
GET    /api/exam-sets/:id/questions                  # Nested resource
```

## URL Structure

### Base URL

```
/api/[resource]/[id]/[sub-resource]
```

### Query Parameters

Use for filtering, sorting, pagination:

```
GET /api/questions?partNumber=1&type=PRACTICE&status=PUBLISHED&page=1&limit=10
```

### Path Parameters

Use for resource identification:

```
GET /api/questions/:id
GET /api/exam-sets/:examSetId/questions/:questionId
```

## Request/Response Format

### Request Body (JSON)

```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "USER"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### List Response (with pagination)

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## HTTP Status Codes

### Success Codes

- **200 OK**: Successful GET, PATCH, DELETE
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE (no response body)

### Client Error Codes

- **400 Bad Request**: Invalid request data (validation error)
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity**: Semantic validation error

### Server Error Codes

- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Maintenance mode

## Authentication

### Bearer Token

```
Authorization: Bearer <jwt_token>
```

### Protected Routes

```typescript
router.get('/api/users/me', authenticate, controller.getCurrentUser)
router.post('/api/admin/questions', authenticate, requireRole('ADMIN'), controller.create)
```

## Versioning

### URL Versioning (if needed in future)

```
/api/v1/questions
/api/v2/questions
```

Currently, no versioning is used. Add when breaking changes are needed.

## Filtering & Sorting

### Filtering

```
GET /api/questions?partNumber=1&status=PUBLISHED&type=PRACTICE
```

### Sorting

```
GET /api/questions?sortBy=createdAt&order=desc
```

### Search

```
GET /api/questions?search=speaking&partNumber=1
```

## Pagination

### Query Parameters

```
GET /api/questions?page=1&limit=10
```

### Response Format

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## File Uploads

### Multipart Form Data

```typescript
POST /api/questions/upload-image
Content-Type: multipart/form-data

file: <binary>
```

### Response

```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/images/123.jpg"
  }
}
```

## Bulk Operations

### Bulk Update

```typescript
PATCH /api/questions/bulk-status
{
  "questionIds": ["id1", "id2", "id3"],
  "status": "PUBLISHED"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded

```
HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## CORS

### Allowed Origins

- Development: `http://localhost:5173`
- Production: Configured via `CLIENT_URL` env variable

### Allowed Methods

- GET, POST, PATCH, DELETE, OPTIONS

### Allowed Headers

- Content-Type, Authorization

## API Documentation

### Swagger (Development Only)

```
GET /api-docs          # Swagger UI
GET /api-docs.json     # OpenAPI spec
```

### JSDoc Comments

```typescript
/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: partNumber
 *         schema:
 *           type: integer
 *         description: Filter by part number (1-5)
 *     responses:
 *       200:
 *         description: List of questions
 */
```

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "age",
      "message": "Must be at least 18"
    }
  ]
}
```

### Not Found

```json
{
  "success": false,
  "message": "Question not found"
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

## Best Practices

### Do's

- ✅ Use consistent response format
- ✅ Use appropriate HTTP status codes
- ✅ Validate all input data
- ✅ Use query parameters for filtering/sorting
- ✅ Use path parameters for resource IDs
- ✅ Return created resource in POST response
- ✅ Use pagination for large lists
- ✅ Document all endpoints
- ✅ Version API when making breaking changes
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Log all API requests

### Don'ts

- ❌ Don't use verbs in URLs
- ❌ Don't return different formats for same endpoint
- ❌ Don't expose internal error details to clients
- ❌ Don't use GET for operations with side effects
- ❌ Don't return 200 for errors
- ❌ Don't forget to validate input
- ❌ Don't return sensitive data (passwords, tokens)
- ❌ Don't use inconsistent naming conventions
- ❌ Don't ignore CORS configuration
- ❌ Don't skip authentication on protected routes

## Common API Patterns

### Health Check

```typescript
GET /health
Response: { status: 'ok', timestamp: '2024-01-01T00:00:00Z' }
```

### Current User

```typescript
GET /api/users/me
Response: { success: true, data: { id, email, fullName, role } }
```

### Soft Delete

```typescript
DELETE /api/questions/:id
Response: { success: true, data: null }
```

### Restore Deleted

```typescript
POST /api/questions/:id/restore
Response: { success: true, data: { id, status: 'DRAFT' } }
```

### Batch Create

```typescript
POST /api/questions/batch
Body: { questions: [...] }
Response: { success: true, data: { created: 10 } }
```
