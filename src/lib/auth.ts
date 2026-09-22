import crypto from 'crypto';

/**
 * Hash a password using PBKDF2 with SHA-512 and a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plain password against a stored PBKDF2 salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(checkHash, 'hex'));
}

/**
 * Validate password according to strict security rules:
 * 1. At least 8 characters
 * 2. No repeating consecutive characters (e.g. 'aa', '11')
 * 3. At least one uppercase letter (A-Z)
 * 4. At least one lowercase letter (a-z)
 * 5. At least one digit (0-9)
 * 6. At least one special character (!@#$%^&*...)
 * 7. Zero whitespace allowed
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  criteria: {
    minLength: boolean;
    noConsecutiveRepeats: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noSpaces: boolean;
  };
  feedback: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  // Check for any consecutive identical characters (e.g., 'aa', '11', '@@')
  const hasConsecutiveRepeats = /(.)\1/.test(password);
  const noConsecutiveRepeats = !hasConsecutiveRepeats && password.length > 0;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password);
  const noSpaces = !/\s/.test(password);

  const criteria = {
    minLength,
    noConsecutiveRepeats,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    noSpaces,
  };

  const feedback: string[] = [];
  if (!minLength) feedback.push('Au moins 8 caractères requis.');
  if (hasConsecutiveRepeats) feedback.push('Aucun caractère identique consécutif (ex: aa, 11 interdit).');
  if (!hasUppercase) feedback.push('Au moins une lettre majuscule (A-Z).');
  if (!hasLowercase) feedback.push('Au moins une lettre minuscule (a-z).');
  if (!hasNumber) feedback.push('Au moins un chiffre (0-9).');
  if (!hasSpecialChar) feedback.push('Au moins un caractère spécial (@, #, $, %, etc.).');
  if (!noSpaces) feedback.push('Aucun espace autorisé.');

  const passedCount = Object.values(criteria).filter(Boolean).length;
  const score = Math.round((passedCount / 7) * 100);
  const isValid = passedCount === 7;

  return { isValid, score, criteria, feedback };
}

/**
 * Validate INE (Identifiant National de l'Étudiant burkinabè)
 * Typically format: 'N' followed by 8 to 11 digits, or alphanumeric format
 */
export function validateIne(ine: string): { isValid: boolean; message?: string } {
  const trimmed = ine.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, message: "L'INE est obligatoire." };
  }
  // Accepts standard BF INE format (e.g. N0123456789 or 10-12 alphanumeric characters)
  const ineRegex = /^[A-Z0-9]{8,15}$/i;
  if (!ineRegex.test(trimmed)) {
    return { isValid: false, message: "Format d'INE invalide (8 à 15 caractères alphanumériques)." };
  }
  return { isValid: true };
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOtp(): string {
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}
