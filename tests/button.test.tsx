import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('renders button with given text', () => {
    // Arrange
    render(<Button>Submit</Button>);

    // Act
    const button = screen.getByRole('button', { name: /submit/i });

    // Assert
    expect(button).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is set', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes correctly', () => {
    // Arrange
    render(<Button variant="destructive">Delete</Button>);

    // Act
    const button = screen.getByRole('button', { name: /delete/i });

    // Assert
    expect(button.className).toContain('bg-destructive');
  });
});
