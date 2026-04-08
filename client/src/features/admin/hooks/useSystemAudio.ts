import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '@/lib/query-keys'
import { systemAudioService } from '../services/system-audio.service'
import type { SystemAudioKey } from '../types'

export function useGetSystemAudio() {
  return useQuery({
    queryKey: queryKeys.systemAudio.all(),
    queryFn: systemAudioService.getAll,
  })
}

export function useUploadSystemAudio(key: SystemAudioKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => systemAudioService.uploadAudio(key, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemAudio.all() })
      message.success('Đã cập nhật audio tín hiệu')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Upload thất bại')
    },
  })
}
