import cron from 'node-cron'
import { MaintenanceScheduleService } from '@/services/maintenance-schedule.service'
import logger from '@/lib/logger'

/**
 * Check maintenance schedules every minute
 * Auto-activate schedules that should start
 * Auto-deactivate schedules that should end
 */
export function startMaintenanceScheduleCheckJob() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await MaintenanceScheduleService.checkSchedules()

      if (result.activated > 0 || result.deactivated > 0) {
        logger.info('Maintenance schedule check completed', {
          activated: result.activated,
          deactivated: result.deactivated,
        })
      }
    } catch (error) {
      logger.error('Maintenance schedule check failed', { error })
    }
  })

  logger.info('Maintenance schedule check job started (runs every minute)')
}
