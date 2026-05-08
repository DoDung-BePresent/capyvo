# Singleton Pattern trong Backend

## Singleton là gì?

**Singleton** là một design pattern đảm bảo một class chỉ có **DUY NHẤT 1 instance** trong toàn bộ ứng dụng.

## Ví dụ đơn giản

```typescript
// ❌ KHÔNG phải Singleton - mỗi lần import tạo instance mới
export class MyService {
  private data: string[] = []
}

// File A
import { MyService } from './service'
const serviceA = new MyService() // Instance 1
serviceA.data.push('A')

// File B
import { MyService } from './service'
const serviceB = new MyService() // Instance 2 (khác instance 1!)
console.log(serviceB.data) // [] - rỗng vì đây là instance khác!

// ✅ Singleton - chỉ có 1 instance duy nhất
class MyService {
  private data: string[] = []
}
export const myService = new MyService() // Tạo 1 lần duy nhất

// File A
import { myService } from './service'
myService.data.push('A')

// File B
import { myService } from './service'
console.log(myService.data) // ['A'] - cùng instance với File A!
```

## Tại sao MaintenanceService cần Singleton?

### 1. Quản lý SSE Clients

```typescript
// SSE client registry - phải là global state
const sseClients = new Set<Response>()

// Nếu có nhiều instance:
// - Client A connect vào instance 1
// - Admin toggle maintenance ở instance 2
// - Client A KHÔNG nhận được update! (vì ở instance khác)
```

### 2. Quản lý Timers

```typescript
let startTimer: ReturnType<typeof setTimeout> | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

// Nếu có nhiều instance:
// - Instance 1 set timer để bật maintenance lúc 10:00
// - Instance 2 clear timer (nhưng clear timer của instance 2, không phải instance 1!)
// - Timer của instance 1 vẫn chạy → maintenance vẫn bật lúc 10:00
```

### 3. In-memory State

```typescript
let maintenanceEnabled: boolean | null = null
let currentSchedule: ScheduleData | null = null

// Nếu có nhiều instance:
// - Instance 1: maintenanceEnabled = true
// - Instance 2: maintenanceEnabled = false
// - API endpoint nào gọi instance nào → kết quả khác nhau!
```

## Khi nào cần Singleton?

### ✅ CẦN Singleton khi:

1. **Quản lý global state** (SSE clients, timers, cache)
2. **Quản lý connections** (database pool, Redis client)
3. **Event emitters** (cần broadcast đến tất cả listeners)
4. **Rate limiters** (đếm requests toàn cục)

### ❌ KHÔNG cần Singleton khi:

1. **Stateless services** (chỉ xử lý logic, không lưu state)
2. **Pure functions** (input → output, không side effects)
3. **Request-scoped data** (mỗi request có data riêng)

## So sánh trong dự án

### Services KHÔNG cần Singleton (stateless)

```typescript
// ✅ QuestionService - stateless, chỉ xử lý logic
export class QuestionService {
  async createPart1(body: unknown) {
    // Chỉ xử lý input → output
    // Không lưu state giữa các calls
    return prisma.question.create(...)
  }
}

// Mỗi controller tạo instance riêng - OK!
class QuestionController {
  private service = new QuestionService()
}
```

### Services CẦN Singleton (stateful)

```typescript
// ✅ MaintenanceService - stateful, quản lý global state
export class MaintenanceService {
  // Global state - phải share giữa tất cả requests
  private sseClients = new Set<Response>()
  private timers = { start: null, end: null }

  addSseClient(res: Response) {
    this.sseClients.add(res) // Thêm vào global registry
  }

  broadcast(data: object) {
    // Broadcast đến TẤT CẢ clients đã connect
    for (const client of this.sseClients) {
      client.write(data)
    }
  }
}

// Phải export instance duy nhất!
export const maintenanceService = new MaintenanceService()
```

## Best Practice

```typescript
// Pattern 1: Stateless Service (không cần singleton)
export class UserService {
  async getUser(id: string) { ... }
  async createUser(data: unknown) { ... }
}

// Pattern 2: Stateful Service (cần singleton)
class CacheService {
  private cache = new Map()
  get(key: string) { return this.cache.get(key) }
  set(key: string, value: any) { this.cache.set(key, value) }
}
export const cacheService = new CacheService() // Singleton

// Pattern 3: Dependency Injection (cho testing)
class NotificationService {
  constructor(private emailService: EmailService) {}
}
// Tạo instance ở entry point, inject vào controllers
```

## Tóm tắt

| Tiêu chí     | Stateless Service             | Stateful Service (Singleton)          |
| ------------ | ----------------------------- | ------------------------------------- |
| State        | Không lưu state               | Có global state                       |
| Instance     | Nhiều instance OK             | Chỉ 1 instance duy nhất               |
| Export       | `export class`                | `export const instance = new Class()` |
| Ví dụ        | QuestionService, AuthService  | MaintenanceService, CacheService      |
| Khi nào dùng | Xử lý logic, database queries | SSE, timers, cache, connections       |
