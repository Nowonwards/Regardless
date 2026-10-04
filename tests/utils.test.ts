import { cn, formatDate, getInitials, truncate, generateId, debounce } from '@/lib/utils';

describe('Utility functions', () => {
  describe('cn', () => {
    it('merges class names and resolves tailwind conflicts', () => {
      // Arrange
      const baseClass = 'px-4 py-2 text-white';
      const overrideClass = 'px-6';

      // Act
      const result = cn(baseClass, overrideClass);

      // Assert
      expect(result).toBe('py-2 text-white px-6');
    });

    it('ignores falsy values correctly', () => {
      // Arrange & Act
      const result = cn('btn', false && 'hidden', undefined, null, 'active');

      // Assert
      expect(result).toBe('btn active');
    });
  });

  describe('getInitials', () => {
    it('extracts two initials from full name', () => {
      // Arrange
      const name = 'John Doe';

      // Act
      const initials = getInitials(name);

      // Assert
      expect(initials).toBe('JD');
    });

    it('handles single word name', () => {
      // Arrange
      const name = 'Regardless';

      // Act
      const initials = getInitials(name);

      // Assert
      expect(initials).toBe('R');
    });
  });

  describe('truncate', () => {
    it('truncates strings longer than specified length', () => {
      // Arrange
      const longText = 'This is a long sentence meant to be truncated';

      // Act
      const truncated = truncate(longText, 10);

      // Assert
      expect(truncated).toBe('This is a...');
    });

    it('returns original string when within length', () => {
      // Arrange
      const shortText = 'Short';

      // Act
      const result = truncate(shortText, 10);

      // Assert
      expect(result).toBe('Short');
    });
  });

  describe('generateId', () => {
    it('generates a non-empty alphanumeric string', () => {
      // Arrange & Act
      const id = generateId();

      // Assert
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('formats a date correctly', () => {
      // Arrange
      const date = new Date('2026-10-04T12:00:00Z');

      // Act
      const formatted = formatDate(date, 'short');

      // Assert
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('4');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('delays execution of function until timer expires', () => {
      // Arrange
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      // Act
      debouncedFn('call1');
      debouncedFn('call2');

      // Assert before timer
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(300);

      // Assert after timer
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call2');
    });
  });
});
