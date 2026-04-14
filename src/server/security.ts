import crypto from 'crypto';

const PASSWORD_SALT = 'bazariyatrou-server-v1';

export function hashPasswordServer(password: string) {
  return crypto
    .createHash('sha256')
    .update(`${PASSWORD_SALT}:${password}`)
    .digest('hex');
}

export function verifyPasswordServer(password: string, expectedHash: string) {
  return hashPasswordServer(password) === expectedHash;
}
