import { useQuery } from '@tanstack/react-query'
import { activityService } from '../services/activity.service'

export function useActivity(enabled = true) {
  return useQuery({
    queryKey: ['activity', 'my'],
    queryFn: activityService.getUserActivity,
    enabled,
  })
}
