import { describe, it, expect } from 'vitest';
import {
  userRequirementsSchema,
  destinationStepSchema,
  datesStepSchema,
  personaStepSchema,
  preferencesStepSchema,
  requestsStepSchema,
  formatValidationError,
  sanitizeStringInput,
  sanitizeArrayInput
} from '../../validation/requirements';
import { z } from 'zod';

describe('Requirements Validation', () => {
  describe('userRequirementsSchema', () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 30);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 32);
    
    const validRequirements = {
      destination: 'Paris, France',
      persona: 'photography' as const,
      dates: {
        startDate: futureDate1,
        endDate: futureDate2
      },
      budgetRange: 'mid-range' as const,
      groupSize: 2,
      specialRequests: ['Anniversary dinner'],
      accessibilityNeeds: ['Wheelchair accessible venues']
    };

    it('should validate correct user requirements', () => {
      expect(() => userRequirementsSchema.parse(validRequirements)).not.toThrow();
    });

    it('should reject invalid destination', () => {
      const invalid = { ...validRequirements, destination: 'X' };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject destination with invalid characters', () => {
      const invalid = { ...validRequirements, destination: 'Paris<script>alert(1)</script>' };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid persona', () => {
      const invalid = { ...validRequirements, persona: 'invalid' };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject past start date', () => {
      const invalid = { 
        ...validRequirements, 
        dates: { 
          startDate: new Date('2020-01-01'), 
          endDate: new Date('2020-01-03') 
        } 
      };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject end date before start date', () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 32);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 30);
      
      const invalid = { 
        ...validRequirements, 
        dates: { 
          startDate: futureStart, 
          endDate: futureEnd 
        } 
      };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject group size of 0', () => {
      const invalid = { ...validRequirements, groupSize: 0 };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject group size over 20', () => {
      const invalid = { ...validRequirements, groupSize: 25 };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject too many special requests', () => {
      const invalid = { 
        ...validRequirements, 
        specialRequests: Array(6).fill('request') 
      };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });

    it('should reject too many accessibility needs', () => {
      const invalid = { 
        ...validRequirements, 
        accessibilityNeeds: Array(11).fill('need') 
      };
      expect(() => userRequirementsSchema.parse(invalid)).toThrow();
    });
  });

  describe('Step validation schemas', () => {
    it('should validate destination step', () => {
      const valid = { destination: 'Paris, France' };
      expect(() => destinationStepSchema.parse(valid)).not.toThrow();
    });

    it('should validate dates step', () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 30);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 32);
      
      const valid = {
        dates: {
          startDate: futureStart,
          endDate: futureEnd
        }
      };
      expect(() => datesStepSchema.parse(valid)).not.toThrow();
    });

    it('should validate persona step', () => {
      const valid = { persona: 'photography' as const };
      expect(() => personaStepSchema.parse(valid)).not.toThrow();
    });

    it('should validate preferences step', () => {
      const valid = { budgetRange: 'mid-range' as const, groupSize: 2 };
      expect(() => preferencesStepSchema.parse(valid)).not.toThrow();
    });

    it('should validate requests step', () => {
      const valid = { 
        specialRequests: ['request'], 
        accessibilityNeeds: ['need'] 
      };
      expect(() => requestsStepSchema.parse(valid)).not.toThrow();
    });
  });

  describe('formatValidationError', () => {
    it('should format zod errors correctly', () => {
      try {
        userRequirementsSchema.parse({ destination: 'X' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error);
          expect(typeof formatted).toBe('object');
          expect(formatted).toHaveProperty('destination');
        }
      }
    });
  });

  describe('sanitizeStringInput', () => {
    it('should remove control characters', () => {
      const result = sanitizeStringInput('hello\x00world');
      expect(result).toBe('helloworld');
    });

    it('should remove script tags', () => {
      const result = sanitizeStringInput('hello<script>alert(1)</script>world');
      expect(result).toBe('helloworld');
    });

    it('should remove HTML tags', () => {
      const result = sanitizeStringInput('hello<div>world</div>');
      expect(result).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      const result = sanitizeStringInput('  hello world  ');
      expect(result).toBe('hello world');
    });
  });

  describe('sanitizeArrayInput', () => {
    it('should filter empty strings', () => {
      const result = sanitizeArrayInput(['valid', '', 'also valid', '   ']);
      expect(result).toEqual(['valid', 'also valid']);
    });

    it('should sanitize each string', () => {
      const result = sanitizeArrayInput(['  hello  ', '<script>alert(1)</script>world']);
      expect(result).toEqual(['hello', 'world']);
    });

    it('should limit array size', () => {
      const input = Array(15).fill('item');
      const result = sanitizeArrayInput(input);
      expect(result).toHaveLength(10);
    });
  });
});