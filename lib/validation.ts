export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt's effective input limit

export const MIN_WORK_MINUTES = 1;
export const MAX_WORK_MINUTES = 180;
export const MIN_BREAK_MINUTES = 1;
export const MAX_BREAK_MINUTES = 60;

export const MAX_TITLE_LENGTH = 200;

export function validateUsername(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "Username must be 3-20 characters and contain only letters, numbers, and underscores.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateDurationMinutes(
  minutes: number,
  min: number,
  max: number,
): string | null {
  if (!Number.isInteger(minutes) || minutes < min || minutes > max) {
    return `Duration must be a whole number between ${min} and ${max} minutes.`;
  }
  return null;
}

export function validateTitle(title: string): string | null {
  if (title.length < 1 || title.length > MAX_TITLE_LENGTH) {
    return `Title must be between 1 and ${MAX_TITLE_LENGTH} characters.`;
  }
  return null;
}
