import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import OpenAI from 'openai';
import { ParseTextDto } from './dto/parse-text.dto';
import { LinkedInDto } from './dto/linkedin.dto';

@Injectable()
export class ImportService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'sk-placeholder') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async parseDocument(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF and DOCX files are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File too large. Maximum file size is 5MB.',
      );
    }

    let extractedText = '';

    try {
      if (file.mimetype === 'application/pdf') {
        const pdfParser = new PDFParse({ data: file.buffer });
        const result = await pdfParser.getText();
        extractedText = result.text;
      } else if (
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      }
    } catch (error) {
      throw new BadRequestException('Failed to parse document: ' + error.message);
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new BadRequestException(
        'Could not extract sufficient text from document',
      );
    }

    // Use AI to structure the extracted text
    const parsedData = await this.structureResumeData(extractedText);

    return {
      extractedText,
      parsedData,
    };
  }

  async parseText(dto: ParseTextDto) {
    if (!dto.text || dto.text.trim().length < 50) {
      throw new BadRequestException('Text content is too short');
    }

    // Use AI to structure the plain text
    const parsedData = await this.structureResumeData(dto.text);

    return {
      parsedData,
    };
  }

  async parseLinkedIn(dto: LinkedInDto) {
    // Note: LinkedIn scraping requires authentication and may violate ToS
    // This is a placeholder implementation
    throw new BadRequestException(
      'LinkedIn import is currently not available. This feature requires LinkedIn API access or OAuth integration.',
    );

    // If implementing, you would:
    // 1. Use LinkedIn OAuth to get user permission
    // 2. Use LinkedIn API to fetch profile data
    // 3. Structure the data into resume format
    // 4. Return structured data
  }

  private async structureResumeData(text: string) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey === 'sk-placeholder') {
      // Return basic structured data without AI
      return {
        personalInfo: {
          name: '',
          email: this.extractEmail(text),
          phone: this.extractPhone(text),
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        rawText: text,
      };
    }

    try {
      const prompt = `Extract structured resume data from the following text. Return a JSON object with these fields:
- personalInfo: { name, email, phone, location }
- summary: professional summary
- experience: array of { company, position, startDate, endDate, description, achievements }
- education: array of { institution, degree, field, startDate, endDate }
- skills: array of skill strings
- certifications: array of certification strings (if any)

Resume text:
${text}

Return only valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a resume parser. Extract structured data from resume text and return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const parsedData = JSON.parse(content);
      return parsedData;
    } catch (error) {
      console.error('AI parsing failed, returning basic structure:', error.message);

      // Fallback to basic parsing
      return {
        personalInfo: {
          name: '',
          email: this.extractEmail(text),
          phone: this.extractPhone(text),
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        rawText: text,
      };
    }
  }

  private extractEmail(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  private extractPhone(text: string): string {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  }
}
