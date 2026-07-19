# Frontend Boilerplate Setup Prompt - shadcn/ui

## Mục đích

Prompt này dùng để tạo boilerplate cho các dự án React + TypeScript mới, sử dụng **shadcn/ui** làm core UI component library thay vì Ant Design.

---

## I. Cấu trúc Thư Mục Cơ Bản

```
src/
├── app/                    # App configuration, routing, providers
│   ├── guards.tsx         # Route guards, auth checks
│   ├── providers.tsx      # Root providers (React Query, Sentry, etc.)
│   ├── router.tsx         # Route definitions
│   └── providers/         # Custom providers
│       └── ScreenSizeProvider.tsx
│
├── assets/                # Static assets
│   ├── images/           # Image files
│   └── sounds/           # Audio files
│
├── config/               # Application configuration
│   ├── index.ts         # Main config export
│   └── ui.config.ts     # UI theme configuration (shadcn colors, etc.)
│
├── features/            # Feature modules (feature-driven architecture)
│   ├── auth/           # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── admin/          # Admin feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── core-feature/   # [Your main feature]
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types.ts
│   │
│   └── [other-features]/
│
├── lib/                # External library configurations
│   ├── axios.ts        # Axios instance with interceptors
│   ├── query-client.ts # React Query configuration
│   ├── query-keys.ts   # React Query key factory
│   ├── supabase.ts     # Supabase client
│   └── sentry.ts       # Error tracking setup
│
├── shared/             # Shared utilities across features
│   ├── components/     # Reusable UI components
│   │   ├── DataTable.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorPages.tsx
│   │   └── [other-shared-components]/
│   │
│   ├── constants/      # Global constants
│   │   ├── error-messages.ts
│   │   └── [other-constants]/
│   │
│   ├── hooks/         # Reusable React hooks
│   │   └── useNetworkStatus.ts
│   │
│   ├── types/         # Shared TypeScript types
│   │   ├── api.ts     # API response/request types
│   │   └── domain.ts  # Domain entities
│   │
│   └── utils/         # Utility functions
│       ├── cn.ts      # Class name utility (clsx)
│       └── [other-utils]/
│
├── App.tsx            # Root component
├── main.tsx           # React DOM render
└── index.css          # Global styles
```

---

## II. Dependency Stack

### Core

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x"
}
```

### UI & Styling

```json
{
  "shadcn-ui": "latest",
  "tailwindcss": "^3.x",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

### Data Management

```json
{
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x"
}
```

### Backend Integration

```json
{
  "@supabase/supabase-js": "^2.x"
}
```

### Monitoring & Error Tracking

```json
{
  "@sentry/react": "^7.x"
}
```

### Development

```json
{
  "eslint": "latest",
  "prettier": "latest",
  "tailwindcss": "^3.x"
}
```

---

## III. Phong Cách Code & Conventions

### 1. Component Structure

```typescript
// File naming: PascalCase for components
// src/features/[feature]/components/ComponentName.tsx

import { FC } from 'react';
import { useCustomHook } from '../hooks/useCustomHook';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import type { ComponentProps } from '../types';

interface Props extends ComponentProps {
  title: string;
  isLoading?: boolean;
}

export const ComponentName: FC<Props> = ({ title, isLoading = false }) => {
  const { data } = useCustomHook();

  return (
    <div className={cn('p-4', isLoading && 'opacity-50')}>
      <h1>{title}</h1>
      <Button variant="default">Click me</Button>
    </div>
  );
};
```

### 2. Custom Hooks

```typescript
// File naming: camelCase with 'use' prefix
// src/features/[feature]/hooks/useCustomHook.ts

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/query-keys'
import { apiService } from '../services'

export const useCustomHook = () => {
  return useQuery({
    queryKey: QueryKeys.feature.list(),
    queryFn: () => apiService.fetchData(),
  })
}
```

### 3. Services/API Layer

```typescript
// src/features/[feature]/services/api.service.ts

import { axios } from '@/lib/axios'
import type { ApiResponse, Entity } from '../types'

export const apiService = {
  fetchData: async (): Promise<ApiResponse<Entity[]>> => {
    const { data } = await axios.get('/api/endpoint')
    return data
  },

  createEntity: async (payload: Entity): Promise<ApiResponse<Entity>> => {
    const { data } = await axios.post('/api/endpoint', payload)
    return data
  },
}
```

### 4. Type Definitions

```typescript
// src/features/[feature]/types.ts

export interface Entity {
  id: string
  name: string
  createdAt: Date
}

export interface ComponentProps {
  // Base props for feature components
}

export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}
```

### 5. Query Keys Pattern

```typescript
// src/lib/query-keys.ts

export const QueryKeys = {
  auth: {
    me: () => ['auth', 'me'],
    profile: (userId: string) => ['auth', 'profile', userId],
  },
  feature: {
    list: () => ['feature', 'list'],
    detail: (id: string) => ['feature', 'detail', id],
  },
}
```

### 6. Tailwind + shadcn/ui

- Use Tailwind utility classes for styling
- Leverage shadcn/ui components for common UI patterns
- Use `cn()` utility for conditional class names

```typescript
<Button
  className={cn(
    'w-full',
    isLoading && 'opacity-50 cursor-not-allowed'
  )}
/>
```

### 7. TypeScript Best Practices

- Always define types for props
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `any` type - use generics or `unknown`
- Export types from feature `types.ts`

---

## IV. Setup & Configuration

### 1. Tailwind Configuration

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors if needed
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### 2. TSConfig Paths

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Environment Variables (.env.local)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## V. Feature Development Workflow

Khi phát triển feature mới, làm theo các bước này:

1. **Create Feature Folder**

   ```
   src/features/[feature-name]/
   ```

2. **Define Types First**

   ```typescript
   // types.ts
   export interface Entity { ... }
   export type ApiResponse<T> { ... }
   ```

3. **Create API Service**

   ```typescript
   // services/api.service.ts
   export const apiService = { ... }
   ```

4. **Create Query Keys**

   ```typescript
   // Thêm vào lib/query-keys.ts
   export const QueryKeys = {
     featureName: { ... }
   }
   ```

5. **Create Custom Hooks**

   ```typescript
   // hooks/useFeatureData.ts
   export const useFeatureData = () => { ... }
   ```

6. **Create Components**

   ```typescript
   // components/FeatureComponent.tsx
   export const FeatureComponent: FC<Props> = () => { ... }
   ```

7. **Create Pages**

   ```typescript
   // pages/FeaturePage.tsx
   export const FeaturePage: FC = () => { ... }
   ```

8. **Add Routes**
   ```typescript
   // app/router.tsx
   // Thêm route cho feature
   ```

---

## VI. Linting & Formatting

### ESLint Rules

- Enforce named exports
- Prevent unused variables
- TypeScript strict mode

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## VII. Best Practices

### ✅ Do's

- Keep features independent and self-contained
- Use React Query for server state management
- Use custom hooks to encapsulate logic
- Define types at feature level first
- Use shadcn/ui components for UI
- Keep components focused and single-responsibility
- Use error boundaries for error handling

### ❌ Don'ts

- Don't mix business logic in components
- Don't create global context for simple state (use React Query)
- Don't import from sibling features directly
- Don't use inline styles, use Tailwind classes
- Don't forget to handle loading/error states
- Don't make components too large (split into smaller sub-components)

---

## VIII. Common Patterns

### Loading States

```typescript
const { data, isLoading, error } = useFeatureData();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorPage error={error} />;
if (!data) return <EmptyState />;

return <div>{/* render data */}</div>;
```

### Form Handling

```typescript
// Use React Hook Form + shadcn/ui Form component
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

export const FormComponent: FC = () => {
  const form = useForm({ defaultValues: { ... } });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
```

### Data Table with shadcn/ui

```typescript
// Use @tanstack/react-table + shadcn/ui Table
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export const DataTable: FC<Props> = ({ data, columns }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {/* header rows */}
      </TableHeader>
      <TableBody>
        {/* body rows */}
      </TableBody>
    </Table>
  );
};
```

---

## IX. Folder Structure Rules

| Folder      | Purpose           | Rule                              |
| ----------- | ----------------- | --------------------------------- |
| `app/`      | App-level setup   | Only routing, providers, guards   |
| `features/` | Feature modules   | Each feature is independent       |
| `lib/`      | 3rd party configs | Setup, not business logic         |
| `shared/`   | Cross-feature     | Reusable components, hooks, utils |
| `assets/`   | Static files      | Images, sounds, icons             |
| `config/`   | App config        | Theme, constants, environment     |

---

## X. Commit Convention

```
feat(feature-name): add new component
fix(feature-name): fix bug in service
refactor(feature-name): improve hook logic
docs: update README
chore: update dependencies
```

---

## Ghi Chú

- **Flexible**: Cấu trúc này là nền tảng, tùy dự án có thể mở rộng
- **Scalable**: Design cho teams lớn, không quá phức tạp cho projects nhỏ
- **Type-Safe**: Full TypeScript support từ đầu
- **Modern Stack**: React 18+, Vite, Tailwind, shadcn/ui
- **DX Friendly**: ESLint, Prettier, hot reload setup sẵn
