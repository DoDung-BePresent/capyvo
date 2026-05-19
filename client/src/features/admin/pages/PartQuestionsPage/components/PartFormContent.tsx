import type { FormInstance } from 'antd'
import type { PartNumber } from '@/features/admin/types'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '@/features/admin/types'
import Part1Form from '@/features/admin/components/Part1Form'
import Part2Form from '@/features/admin/components/Part2Form'
import Part3Form from '@/features/admin/components/Part3Form'
import Part4Form from '@/features/admin/components/Part4Form'
import Part5Form from '@/features/admin/components/Part5Form'

interface PartFormContentProps {
  partNumber: PartNumber
  form: FormInstance
  onSubmit: (values: unknown) => void
}

export function PartFormContent({ partNumber, form, onSubmit }: PartFormContentProps) {
  switch (partNumber) {
    case 1:
      return <Part1Form form={form} onSubmit={onSubmit as (v: Part1FormValues) => void} />
    case 2:
      return <Part2Form form={form} onSubmit={onSubmit as (v: Part2FormValues) => void} />
    case 3:
      return <Part3Form form={form} onSubmit={onSubmit as (v: Part3FormValues) => void} />
    case 4:
      return <Part4Form form={form} onSubmit={onSubmit as (v: Part4FormValues) => void} />
    default:
      return <Part5Form form={form} onSubmit={onSubmit as (v: Part5FormValues) => void} />
  }
}
