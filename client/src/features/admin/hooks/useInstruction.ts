import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

/**
 * Libs
 */
import { queryKeys } from '@/lib/query-keys'

/**
 * Services
 */
import { instructionService } from '../services/instruction.service'

export function useGetInstructions() {
  return useQuery({
    queryKey: queryKeys.partInstructions.all(),
    queryFn: instructionService.getAll,
  })
}

export function useUploadInstructionAudio(partNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => instructionService.uploadAudio(partNumber, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partInstructions.all() })
      message.success(`Đã cập nhật audio Part ${partNumber}`)
    },
    onError: (err: Error) => {
      message.error(err.message || 'Upload thất bại')
    },
  })
}
