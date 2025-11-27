/**
 * File upload validation and utilities
 */

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: {
  size: number;
  type: string;
  name: string;
}): { valid: boolean; error?: string } {
  // Check file size
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!validateFileType(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF and DOCX files are allowed.',
    };
  }

  // Check file extension
  if (!validateFileExtension(file.name)) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .pdf and .docx files are allowed.',
    };
  }

  return { valid: true };
}

/**
 * Convert File to Buffer (for Next.js API routes)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Limit length
}
