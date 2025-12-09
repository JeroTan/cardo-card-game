import { t } from 'elysia';

export function tboxName({fieldName = "Field", minLength = 2, maxLength = 64}:{fieldName?: string, minLength?: number, maxLength?: number} = {}){
  return t.String({
    minLength,
    maxLength,
    pattern: '^[\\p{L}\\p{M}\'ñÑáéíóúÁÉÍÓÚ\\s\\-\\.,]+$',
    description: fieldName,
    error: `${fieldName} should only contain letters, numbers, spaces, and the characters ., ' "`
  });
}

export function tboxTextEssentials({fieldName = "Field", minLength = 2, maxLength = 150}:{fieldName?: string, minLength?: number, maxLength?: number} = {}) {
  return t.String({
    minLength,
    maxLength,
    pattern: '^[\\p{L}\\p{M}\'ñÑáéíóúÁÉÍÓÚ\\s\\.,0-9 !"&\'()+,\\-./:;=\\\\_]+$',
    description: fieldName,
    error: `${fieldName} should only contain letters, numbers, spaces and some essential characters.`
  });
}

export function tboxEmail({fieldName = "Email Address", minLength = 5, maxLength = 100}:{fieldName?: string, minLength?: number, maxLength?: number} = {}){
  return t.String({
    format: 'email',
    minLength,
    maxLength,
    description: fieldName,
    error: `Invalid ${fieldName}.`
  });
}

export function tboxPassword({fieldName = "Password", minLength = 8, maxLength = 256}:{fieldName?: string, minLength?: number, maxLength?: number} = {}){
  return t.String({
    minLength,
    maxLength,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    description: fieldName,
    error: `${fieldName} should contain at least one lowercase letter, one uppercase letter, and one digit.`
  });
}

export function tboxAlphaNumericSpace({fieldName = "Field", minLength = 2, maxLength = 32}:{fieldName?: string, minLength?: number, maxLength?: number} = {}){
  return t.String({
    minLength,
    maxLength,
    pattern: '^[a-zA-Z0-9 ]+$',
    description: fieldName,
    error: `${fieldName} should only contain letters, numbers and spaces.`
  });
}

export function tboxLargeText({fieldName = "Field", maxLength = 512}:{fieldName?: string, maxLength?: number} = {}) {
  return t.String({
    maxLength,
    description: fieldName,
    error: `${fieldName} must be at most ${maxLength} characters long.`
  });
}

export function tboxAddress({fieldName = "Address", minLength = 5, maxLength = 150}:{fieldName?: string, minLength?: number, maxLength?: number} = {}){
  return t.String({
    pattern: '^[A-Za-z0-9 !"&\'()+,\\-./:;=\\\\_]+$',
    maxLength,
    description: fieldName,
    error: `${fieldName} should only contain letters, numbers, spaces and some essential characters.`
  });
}

export function tbox0To9({fieldName = "Field"}:{fieldName?: string} = {}){
  return t.Number({
    minimum: 0,
    maximum: 9,
    description: fieldName,
    error: `${fieldName} must be a number from 0 to 9.`
  });
}

export function tboxRarity({fieldName = "Rarity"}:{fieldName?: string} = {}){
  return t.Number({
    minimum: 1,
    maximum: 5,
    description: fieldName,
    error: `${fieldName} must be a number from 1 to 5.`
  });
}

export function tboxFile({fieldName = "File", fileTypes = ['image/jpeg']}:{fieldName?: string, fileTypes?: string[]} = {}){
  return t.File({
    type: fileTypes,
    description: fieldName,
    error: `${fieldName} must be a ${fileTypes.join(", ")}.`
  });
}

export function tboxImage({fieldName = "Image"}:{fieldName?: string} = {}){
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return tboxFile({fieldName, fileTypes: imageTypes});
}
