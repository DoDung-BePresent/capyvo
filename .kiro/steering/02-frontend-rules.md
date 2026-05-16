# Frontend Coding Rules

## General Principles

- Write TypeScript with strict type checking
- Use functional components with hooks (no class components)
- Follow feature-based architecture
- Keep components small and focused (< 200 lines)
- Prefer composition over inheritance
- Use absolute imports with `@/` prefix

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Pages**: PascalCase with `Page` suffix (e.g., `HomePage.tsx`)

## Component Structure

### Component Organization

```tsx
// 1. Imports (grouped)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { CustomComponent } from '@/shared/components'
import { useCustomHook } from '@/shared/hooks'
import type { User } from '@/shared/types'

// 2. Types/Interfaces
interface MyComponentProps {
  userId: string
  onSuccess?: () => void
}

// 3. Component
export function MyComponent({ userId, onSuccess }: MyComponentProps) {
  // 3a. Hooks (in order: state, queries, mutations, effects, refs)
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading } = useQuery(...)
  const mutation = useMutation(...)

  // 3b. Event handlers
  const handleClick = () => {
    // ...
  }

  // 3c. Render helpers (if needed)
  const renderContent = () => {
    // ...
  }

  // 3d. Early returns
  if (isLoading) return <Spinner />
  if (!data) return null

  // 3e. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Component Export

- **Named exports** for components (not default exports)
- Use barrel exports in `index.ts` for public API

```tsx
// ✅ Good
export function UserProfile() {}

// ❌ Bad
export default function UserProfile() {}
```

## State Management

### TanStack Query (Server State)

- Use for all server data fetching
- Define query keys in `lib/query-keys.ts`
- Use custom hooks for queries/mutations

```tsx
// lib/query-keys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
}

// hooks/useUser.ts
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => api.getUser(userId),
  })
}
```

### Zustand (Client State)

- Use for UI state, preferences, temporary data
- Keep stores small and focused
- Use slices for large stores

```tsx
// stores/useAuthStore.ts
interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

## Styling

### Tailwind CSS

- Use Tailwind utility classes as primary styling method
- Use `clsx` or `tailwind-merge` for conditional classes

```tsx
import { cn } from '@/shared/utils/cn'

;<div className={cn('px-4 py-2 rounded', isActive && 'bg-blue-500', isDisabled && 'opacity-50')} />
```

### Ant Design

- Use Ant Design components for complex UI (tables, forms, modals)
- Customize theme in `config/ui.config.ts`
- Don't override Ant Design styles with custom CSS unless necessary

### Material-UI

- Use sparingly, only when Ant Design doesn't have the component
- Prefer Ant Design for consistency

## Forms

### Form Handling

- Use Ant Design Form for complex forms
- Use controlled components for simple forms
- Validate on submit, not on every keystroke

```tsx
import { Form, Input, Button } from 'antd'

export function LoginForm() {
  const [form] = Form.useForm()

  const handleSubmit = (values: LoginFormValues) => {
    // Handle submit
  }

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Login
      </Button>
    </Form>
  )
}
```

## API Integration

### Axios Instance

- Use the configured axios instance from `lib/axios.ts`
- Automatically includes auth token
- Handles 401 redirects

```tsx
import axios from '@/lib/axios'

export async function getUser(id: string) {
  const { data } = await axios.get(`/users/${id}`)
  return data.data // API returns { success, data }
}
```

### API Response Format

All API responses follow this format:

```typescript
{
  success: boolean
  data?: T
  message?: string
}
```

## Error Handling

### Error Boundaries

- Wrap route components with ErrorBoundary
- Show user-friendly error messages

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <MyComponent />
</ErrorBoundary>
```

### Query Error Handling

```tsx
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: getUsers,
})

if (isError) {
  return <Alert type="error" message={error.message} />
}
```

## Routing

### Route Guards

- Use `ProtectedRoute` for authenticated routes
- Use `RoleRoute` for role-based access
- Use `GuestRoute` for login/register pages

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<RoleRoute role="ADMIN" />}>
    <Route path="/admin" element={<AdminDashboard />} />
  </Route>
</Route>
```

### Lazy Loading

- Use lazy loading for all route components
- Use the `lazy` helper from `app/router.tsx`

```tsx
const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  async () => ({ Component: (await importFn()).default })

{
  path: '/admin',
  lazy: lazy(() => import('@/features/admin/pages/AdminDashboard'))
}
```

## Performance

### Memoization

- Use `useMemo` for expensive computations
- Use `useCallback` for callbacks passed to child components
- Don't over-optimize - measure first

```tsx
const sortedUsers = useMemo(() => users.sort((a, b) => a.name.localeCompare(b.name)), [users])

const handleClick = useCallback(() => {
  // Handler logic
}, [dependency])
```

### Code Splitting

- Split large features into separate chunks
- Use dynamic imports for heavy libraries

```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

## Accessibility

### Semantic HTML

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Add ARIA labels when needed

```tsx
<button aria-label="Close modal" onClick={onClose}>
  <CloseIcon />
</button>
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Test with Tab key navigation

## Testing (Future)

- Write tests for critical user flows
- Use React Testing Library
- Test behavior, not implementation

## Common Patterns

### Loading States

```tsx
if (isLoading) return <Spin size="large" />
if (isError) return <Alert type="error" message="Failed to load" />
if (!data) return null
```

### Conditional Rendering

```tsx
// ✅ Good - Early return
if (!user) return <LoginPrompt />
return <UserProfile user={user} />

// ✅ Good - Ternary for simple cases
{
  isOpen ? <Modal /> : null
}

// ❌ Bad - Nested ternaries
{
  isOpen ? isLoading ? <Spinner /> : <Content /> : null
}
```

### List Rendering

```tsx
// Always use key prop
{
  users.map((user) => <UserCard key={user.id} user={user} />)
}

// Show empty state
{
  users.length === 0 ? (
    <Empty description="No users found" />
  ) : (
    users.map((user) => <UserCard key={user.id} user={user} />)
  )
}
```

## Don'ts

- ❌ Don't use `any` type (use `unknown` if needed)
- ❌ Don't mutate state directly
- ❌ Don't use inline styles (use Tailwind)
- ❌ Don't use `var` (use `const` or `let`)
- ❌ Don't use default exports for components
- ❌ Don't fetch data in components (use hooks)
- ❌ Don't use `useEffect` for data fetching (use TanStack Query)
- ❌ Don't use `index` as key in lists
- ❌ Don't ignore TypeScript errors
- ❌ Don't commit console.log statements
