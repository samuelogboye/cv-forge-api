import mammoth from 'mammoth';

// Import pdf-parse as external CommonJS module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

/**
 * Extract text from PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Parse resume file based on type
 */
export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return parsePDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDOCX(buffer);
  } else {
    throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
  }
}

/**
 * Basic text-based resume parser (fallback)
 * Extracts common sections using regex patterns
 */
export function parseResumeText(text: string): any {
  const result: any = {
    name: '',
    email: '',
    phone: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // Extract name (assume first line or first few words before email)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    result.name = lines[0].trim();
  }

  // Extract skills (look for common section headers)
  const skillsMatch = text.match(
    /(?:SKILLS|TECHNICAL SKILLS|COMPETENCIES)[:\s]+([\s\S]*?)(?=\n\n|EXPERIENCE|EDUCATION|$)/i
  );
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    result.skills = skillsText
      .split(/[,•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50);
  }

  // Extract experience section
  const experienceMatch = text.match(
    /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT)[:\s]+([\s\S]*?)(?=\n\n(?:EDUCATION|SKILLS)|$)/i
  );
  if (experienceMatch) {
    result.experience = parseExperienceSection(experienceMatch[1]);
  }

  // Extract education section
  const educationMatch = text.match(
    /(?:EDUCATION|ACADEMIC)[:\s]+([\s\S]*?)(?=\n\n(?:EXPERIENCE|SKILLS)|$)/i
  );
  if (educationMatch) {
    result.education = parseEducationSection(educationMatch[1]);
  }

  return result;
}

/**
 * Parse experience section into structured data
 */
function parseExperienceSection(text: string): any[] {
  const experiences: any[] = [];
  const entries = text.split(/\n\n+/);

  for (const entry of entries) {
    if (entry.trim().length < 10) continue;

    const lines = entry.split('\n').filter(l => l.trim());
    if (lines.length < 2) continue;

    experiences.push({
      title: lines[0]?.trim() || '',
      company: lines[1]?.trim() || '',
      duration: lines[2]?.trim() || '',
      description: lines.slice(3).join(' ').trim() || '',
    });
  }

  return experiences;
}

/**
 * Parse education section into structured data
 */
function parseEducationSection(text: string): any[] {
  const education: any[] = [];
  const entries = text.split(/\n\n+/);

  for (const entry of entries) {
    if (entry.trim().length < 5) continue;

    const lines = entry.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    education.push({
      degree: lines[0]?.trim() || '',
      school: lines[1]?.trim() || '',
      year: lines[2]?.trim() || '',
    });
  }

  return education;
}

/**
 * Clean and normalize extracted text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .trim();
}
