import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const status = err.status || 'error'

  // 记录错误日志
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  })

  // 开发环境显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      error: err.message,
      stack: err.stack
    })
  }

  // 生产环境只显示安全的错误信息
  if (err.isOperational) {
    return res.status(statusCode).json({
      status,
      error: err.message
    })
  }

  // 未知错误，不暴露给客户端
  res.status(500).json({
    status: 'error',
    error: '服务器内部错误'
  })
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.isOperational = true
  return error
}