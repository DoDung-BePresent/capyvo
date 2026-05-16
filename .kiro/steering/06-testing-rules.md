# Testing Rules (Future Implementation)

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\
     /      \    Integration Tests (Some)
    /________\
   /          \  Unit Tests (Many)
  /____________\
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: All critical API endpoints
- **E2E Tests**: Critical user flows

## Unit Testing

### What to Test

- Service layer business logic
- Utility functions
- Data transformations
- Validation logic
- Error handling

### What NOT to Test

- Prisma queries (trust the ORM)
- Third-party libraries
- Simple getters/setters
- Configuration files

### Example Unit Test (Service)

```typescript
// services/__tests__/user.service.test.ts
import { UserService } from '../user.service'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma')

describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    service = new UserService()
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.findById('1')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
    })

    it('should return null when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.findById('999')

      expect(result).toBeNull()
    })
  })
})
```

## Integration Testing

### What to Test

- API endpoints (request → response)
- Authentication/authorization
- Database operations
- File uploads
- Error responses

### Setup Test Database

```typescript
// tests/setup.ts
import { execSync } from 'child_process'

beforeAll(async () => {
  // Reset test database
  execSync('npx prisma migrate reset --force --skip-seed')
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### Example Integration Test (API)

```typescript
// controllers/__tests__/user.controller.test.ts
import request from 'supertest'
import app from '@/app'
import prisma from '@/lib/prisma'

describe('User API', () => {
  let authToken: string

  beforeAll(async () => {
    // Create test user and get token
    const user = await prisma.user.create({
      data: { email: 'test@example.com', role: 'USER' },
    })
    authToken = generateTestToken(user.id)
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
  })

  describe('GET /api/users/:id', () => {
    it('should return user when authenticated', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@example.com' },
      })

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('user@example.com')
    })

    it('should return 401 when not authenticated', async () => {
      await request(app).get('/api/users/123').expect(401)
    })

    it('should return 404 when user not found', async () => {
      await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
```

## Frontend Testing

### Component Testing

```typescript
// components/__tests__/UserProfile.test.tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from '../UserProfile'

describe('UserProfile', () => {
  it('should render user information', () => {
    const user = { id: '1', email: 'test@example.com', fullName: 'Test User' }

    render(<UserProfile user={user} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<UserProfile user={null} isLoading={true} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
// hooks/__tests__/useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUser } from '../useUser'

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useUser', () => {
  it('should fetch user data', async () => {
    const { result } = renderHook(() => useUser('1'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
  })
})
```

## E2E Testing (Playwright/Cypress)

### Critical User Flows

- User registration and login
- Practice session flow
- Payment flow
- Admin question creation

### Example E2E Test

```typescript
// e2e/practice-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can complete practice session', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to practice
  await page.goto('/practice/part/1')
  await expect(page.locator('h1')).toContainText('Part 1')

  // Start practice
  await page.click('text=Start Practice')

  // Wait for question
  await expect(page.locator('.question-content')).toBeVisible()

  // Record audio (mock)
  await page.click('button[aria-label="Start Recording"]')
  await page.waitForTimeout(2000)
  await page.click('button[aria-label="Stop Recording"]')

  // Submit
  await page.click('text=Submit')

  // Check results
  await expect(page.locator('.score')).toBeVisible()
})
```

## Test Utilities

### Mock Data Factories

```typescript
// tests/factories/user.factory.ts
export function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'USER',
    isPremium: false,
    createdAt: new Date(),
    ...overrides,
  }
}
```

### Test Helpers

```typescript
// tests/helpers/auth.helper.ts
export function generateTestToken(userId: string): string {
  // Generate JWT for testing
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!)
}

export async function createAuthenticatedRequest(app: Express) {
  const user = await prisma.user.create({
    data: { email: 'test@example.com' },
  })
  const token = generateTestToken(user.id)

  return {
    user,
    token,
    request: () => request(app).set('Authorization', `Bearer ${token}`),
  }
}
```

## Mocking

### Mock External Services

```typescript
// __mocks__/openai.ts
export class OpenAI {
  audio = {
    speech: {
      create: jest.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    },
    transcriptions: {
      create: jest.fn().mockResolvedValue({
        text: 'Mock transcription',
      }),
    },
  }
}
```

### Mock Supabase

```typescript
// __mocks__/@/lib/supabase.ts
export default {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://mock-url.com/file.jpg' },
      })),
    })),
  },
}
```

## Test Configuration

### Jest Config (Backend)

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/__tests__/**'],
}
```

### Vitest Config (Frontend)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

## Best Practices

### Do's

- ✅ Write tests before fixing bugs (TDD for bugs)
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests independent and isolated
- ✅ Mock external dependencies
- ✅ Test edge cases and error scenarios
- ✅ Use factories for test data
- ✅ Clean up test data after tests
- ✅ Run tests in CI/CD pipeline
- ✅ Maintain test coverage above 80%

### Don'ts

- ❌ Don't test implementation details
- ❌ Don't write tests that depend on each other
- ❌ Don't use real external services in tests
- ❌ Don't commit failing tests
- ❌ Don't skip tests with `.skip()` permanently
- ❌ Don't test third-party code
- ❌ Don't use production database for tests
- ❌ Don't write overly complex tests
- ❌ Don't ignore test failures
- ❌ Don't forget to test error cases
