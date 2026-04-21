import { describe, it, expect } from 'vitest';
import { parseAIJSON, sanitizePromptInput } from './ai-utils.js';

describe('ai-utils', () => {
  describe('parseAIJSON', () => {
    it('should parse valid JSON', () => {
      const input = 'Here is your JSON: {"name": "Test Token", "score": 85}';
      const result = parseAIJSON(input);
      expect(result).toEqual({ name: 'Test Token', score: 85 });
    });

    it('should handle markdown code blocks', () => {
      const input = '```json\n{"name": "Markdown Token"}\n```';
      const result = parseAIJSON(input);
      expect(result).toEqual({ name: 'Markdown Token' });
    });

    it('should handle trailing commas in objects', () => {
      const input = '{"name": "Comma Token",}';
      const result = parseAIJSON(input);
      expect(result).toEqual({ name: 'Comma Token' });
    });

    it('should throw error on empty input', () => {
      expect(() => parseAIJSON('')).toThrow('Empty AI response');
    });

    it('should throw error on invalid structure', () => {
      expect(() => parseAIJSON('No JSON here')).toThrow('No JSON structure found in AI response');
    });
  });

  describe('sanitizePromptInput', () => {
    it('should trim and slice long strings', () => {
      const input = '   A very long string   '.repeat(50);
      const result = sanitizePromptInput(input, 10);
      expect(result).toBe('A very lon');
    });

    it('should remove potential HTML tags', () => {
      const input = 'Hello <script>alert(1)</script>';
      const result = sanitizePromptInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should flatten multiple lines', () => {
      const input = 'Line 1\nLine 2\r\nLine 3';
      const result = sanitizePromptInput(input);
      expect(result).toBe('Line 1 Line 2 Line 3');
    });
  });
});
