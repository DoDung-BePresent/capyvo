# Vite Environment Variables

## Built-in Environment Variables

Vite tự động cung cấp các biến môi trường built-in, **KHÔNG CẦN** định nghĩa trong `.env`:

### `import.meta.env.DEV`

- **Type:** `boolean`
- **Value:** `true` khi chạy dev server (`npm run dev`)
- **Value:** `false` khi build production (`npm run build`)
- **Use case:** Hiển thị debug info, dev tools, error details

```typescript
// ✅ Sử dụng trực tiếp, không cần định nghĩa
if (import.meta.env.DEV) {
  console.log('Development mode')
}
```

### `import.meta.env.PROD`

- **Type:** `boolean`
- **Value:** `true` khi build production
- **Value:** `false` khi chạy dev server
- **Use case:** Enable production-only features

```typescript
if (import.meta.env.PROD) {
  // Enable analytics, monitoring, etc.
}
```

### `import.meta.env.MODE`

- **Type:** `string`
- **Value:** `'development'` hoặc `'production'`
- **Use case:** Check mode as string

```typescript
if (import.meta.env.MODE === 'development') {
  // Dev-specific code
}
```

### `import.meta.env.BASE_URL`

- **Type:** `string`
- **Value:** Base URL của app (từ `vite.config.ts`)
- **Default:** `'/'`

## Custom Environment Variables

Các biến tự định nghĩa **PHẢI** bắt đầu với `VITE_`:

### Định nghĩa trong `.env`

```bash
# ✅ Đúng - Bắt đầu với VITE_
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# ❌ Sai - Không bắt đầu với VITE_
API_URL=http://localhost:3000/api  # Không accessible
NODE_ENV=development                # Không accessible (dùng import.meta.env.MODE)
```

### Sử dụng trong code

```typescript
// ✅ Đúng
const apiUrl = import.meta.env.VITE_API_URL

// ❌ Sai
const apiUrl = process.env.VITE_API_URL // process.env không tồn tại trong Vite
```

## Environment Files

Vite hỗ trợ nhiều file `.env`:

```
.env                # Loaded in all cases
.env.local          # Loaded in all cases, ignored by git
.env.[mode]         # Only loaded in specified mode
.env.[mode].local   # Only loaded in specified mode, ignored by git
```

**Priority (cao → thấp):**

1. `.env.[mode].local`
2. `.env.[mode]`
3. `.env.local`
4. `.env`

**Example:**

```
.env                    # Base config
.env.local              # Local overrides (gitignored)
.env.production         # Production-specific
.env.development        # Development-specific
```

## TypeScript Support

Để có type safety, định nghĩa types trong `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Common Use Cases

### 1. Conditional Debug Info

```typescript
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}
```

### 2. API URL Configuration

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
```

### 3. Feature Flags

```typescript
const ENABLE_ANALYTICS = import.meta.env.PROD
const ENABLE_DEV_TOOLS = import.meta.env.DEV
```

### 4. Error Details

```typescript
// Show detailed errors only in development
if (import.meta.env.DEV && error) {
  return (
    <details>
      <summary>Error Details (Dev Only)</summary>
      <pre>{error.stack}</pre>
    </details>
  )
}
```

## Security Notes

⚠️ **IMPORTANT:**

- Tất cả `VITE_*` variables đều được **expose** ra client-side code
- **KHÔNG BAO GIỜ** lưu secrets, API keys, passwords trong `VITE_*` variables
- Chỉ lưu public information (API URLs, public keys, etc.)

```bash
# ❌ NGUY HIỂM - Exposed to client
VITE_DATABASE_PASSWORD=secret123
VITE_ADMIN_API_KEY=admin-key-123

# ✅ AN TOÀN - Public information
VITE_API_URL=https://api.example.com
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Public anon key, not secret
```

## Comparison: Vite vs Node.js

| Feature       | Vite (Client)          | Node.js (Server)                         |
| ------------- | ---------------------- | ---------------------------------------- |
| Access        | `import.meta.env`      | `process.env`                            |
| Prefix        | `VITE_*` required      | No prefix needed                         |
| Built-in DEV  | `import.meta.env.DEV`  | `process.env.NODE_ENV === 'development'` |
| Built-in PROD | `import.meta.env.PROD` | `process.env.NODE_ENV === 'production'`  |
| Security      | All exposed to client  | Server-side only                         |

## Summary

✅ **Không cần định nghĩa:**

- `import.meta.env.DEV`
- `import.meta.env.PROD`
- `import.meta.env.MODE`
- `import.meta.env.BASE_URL`

✅ **Cần định nghĩa (với prefix `VITE_`):**

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SENTRY_DSN`
- Các custom variables khác

❌ **Không dùng được:**

- `process.env.*` (Node.js only)
- Variables không có prefix `VITE_`
- `NODE_ENV` (dùng `import.meta.env.MODE` thay thế)
