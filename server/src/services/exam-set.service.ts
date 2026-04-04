import { NotFoundError } from '@/errors/app-error'

// Placeholder service — replace with actual Supabase queries
export class ExamSetService {
  async findAll() {
    // TODO: query supabase
    return []
  }

  async findById(_id: string) {
    // TODO: query supabase
    const examSet = null
    if (!examSet) throw new NotFoundError('ExamSet')
    return examSet
  }

  async create(payload: unknown) {
    // TODO: validate with zod, insert to supabase
    return payload
  }

  async update(id: string, payload: unknown) {
    // TODO: validate with zod, update in supabase
    return { id, ...((payload as object) ?? {}) }
  }

  async remove(id: string) {
    // TODO: delete from supabase
    return id
  }
}
