import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env['JWT_SECRET']!
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET']!
const JWT_EXPIRES_IN = '15m' // Access token expires in 15 minutes
const JWT_REFRESH_EXPIRES_IN = '7d' // Refresh token expires in 7 days

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export class JWTService {
  /**
   * Generate access token
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    })
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (err) {
      throw new Error('Invalid or expired access token', { cause: err })
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
    } catch (err) {
      throw new Error('Invalid or expired refresh token', { cause: err })
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload: JWTPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: 900, // 15 minutes in seconds
    }
  }
}

export const jwtService = new JWTService()
