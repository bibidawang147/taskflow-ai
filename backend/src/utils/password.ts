import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const validatePassword = (password: string): string[] => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }

  return errors
}