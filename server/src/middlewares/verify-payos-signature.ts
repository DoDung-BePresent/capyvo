/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import logger from '@/lib/logger'
import { env } from '@/config/env'

/**
 * Sort object by keys alphabetically (for PayOS signature generation)
 */
function sortObjDataByKey(object: Record<string, any>): Record<string, any> {
  return Object.keys(object)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = object[key]
        return obj
      },
      {} as Record<string, any>,
    )
}

/**
 * Convert object to query string for PayOS signature
 * Format: key1=value1&key2=value2...
 */
function convertObjToQueryStr(object: Record<string, any>): string {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key]

      // Sort nested object
      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((val: any) => sortObjDataByKey(val)))
      }

      // Set empty string if null
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = ''
      }

      return `${key}=${value}`
    })
    .join('&')
}

/**
 * Middleware to verify PayOS webhook signature
 * Prevents fake webhook attacks
 *
 * PayOS webhook format:
 * {
 *   code: '00',
 *   desc: 'success',
 *   success: true,
 *   data: { ... },
 *   signature: 'abc123...'
 * }
 */
export function verifyPayOSSignature(req: Request, res: Response, next: NextFunction): void {
  try {
    const webhookBody = req.body
    const checksumKey = env.PAYOS_CHECKSUM_KEY

    // Check if webhook has required fields
    if (!webhookBody || !webhookBody.signature || !webhookBody.data) {
      logger.warn('PayOS webhook received with invalid format', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        hasSignature: !!webhookBody?.signature,
        hasData: !!webhookBody?.data,
      })
      res.status(400).json({
        success: false,
        message: 'Invalid webhook format',
      })
      return
    }

    // Verify signature using PayOS algorithm
    const { signature, data } = webhookBody

    // DEBUG: Log signature generation process
    const sortedDataByKey = sortObjDataByKey(data)
    const dataQueryStr = convertObjToQueryStr(sortedDataByKey)
    const expectedSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(dataQueryStr)
      .digest('hex')

    logger.debug('PayOS signature verification debug', {
      receivedSignature: signature,
      expectedSignature: expectedSignature,
      queryString: dataQueryStr,
      sortedKeys: Object.keys(sortedDataByKey),
      checksumKeyPrefix: checksumKey.substring(0, 10) + '...',
    })

    const isValid = signature === expectedSignature

    if (!isValid) {
      logger.warn('Invalid PayOS webhook signature', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        orderCode: data?.orderCode,
        receivedSignature: signature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...',
      })
      res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      })
      return
    }

    // Signature valid, proceed
    logger.info('PayOS webhook signature verified', {
      orderCode: data?.orderCode,
      code: webhookBody.code,
      ip: req.ip,
    })
    next()
  } catch (err) {
    logger.error('Error verifying PayOS webhook signature', { error: err })
    res.status(500).json({
      success: false,
      message: 'Error verifying webhook signature',
    })
  }
}
