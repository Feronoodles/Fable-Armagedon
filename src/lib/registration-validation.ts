export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 32;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

export type Registration = { username: string; email: string; password: string };
type RegistrationErrorCode = "BODY" | "USERNAME" | "EMAIL" | "PASSWORD";

const messages: Record<RegistrationErrorCode, { es: string; en: string }> = {
  BODY: { es: "La solicitud de registro no es válida.", en: "The registration request is invalid." },
  USERNAME: { es: "El nombre de usuario debe tener entre 3 y 32 caracteres.", en: "Your username must contain between 3 and 32 characters." },
  EMAIL: { es: "Introduce un correo electrónico válido de hasta 254 caracteres.", en: "Enter a valid email address of up to 254 characters." },
  PASSWORD: { es: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.", en: "Your password must contain at least 8 characters and no more than 72 bytes." },
};

export class RegistrationValidationError extends Error {
  constructor(public code: RegistrationErrorCode) { super(messages[code].es); }
}

export function registrationErrorMessage(error: RegistrationValidationError, language: string) {
  return messages[error.code][language === "en" ? "en" : "es"];
}

/** Normalize account identifiers only; bcrypt must receive the password exactly as entered. */
export function parseRegistration(body: unknown): Registration {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new RegistrationValidationError("BODY");
  const input = body as Record<string, unknown>;
  if (typeof input.username !== "string") throw new RegistrationValidationError("USERNAME");
  const username = input.username.trim();
  if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH)
    throw new RegistrationValidationError("USERNAME");
  if (typeof input.email !== "string") throw new RegistrationValidationError("EMAIL");
  const email = input.email.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new RegistrationValidationError("EMAIL");
  if (typeof input.password !== "string" || input.password.length > MAX_PASSWORD_BYTES ||
    Array.from(input.password).length < MIN_PASSWORD_LENGTH || new TextEncoder().encode(input.password).length > MAX_PASSWORD_BYTES)
    throw new RegistrationValidationError("PASSWORD");
  return { username, email, password: input.password };
}
