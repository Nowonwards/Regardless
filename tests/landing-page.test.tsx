import React from 'react';
import { render, screen } from '@testing-library/react';
import { LandingLogo } from '@/components/landing/LandingLogo';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { TickerStrip } from '@/components/landing/TickerStrip';
import { IdeateSection } from '@/components/landing/IdeateSection';
import { PipelineSection } from '@/components/landing/PipelineSection';

describe('Landing Page Components', () => {
  describe('LandingLogo', () => {
    it('renders the Regardless wordmark and SVG logo mark', () => {
      // Arrange & Act
      render(<LandingLogo />);

      // Assert
      expect(screen.getByText('Regardless')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /regardless home/i })).toBeInTheDocument();
    });
  });

  describe('LandingNav', () => {
    it('renders navigation links and login CTA button', () => {
      // Arrange & Act
      render(<LandingNav loginHref="/sign-in" />);

      // Assert
      expect(screen.getByRole('link', { name: /ideate/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument();
      const studioCta = screen.getByRole('link', { name: /open the studio/i });
      expect(studioCta).toHaveAttribute('href', '/sign-in');
    });
  });

  describe('HeroSection', () => {
    it('renders platform tags, 3-line headline, and session CTAs', () => {
      // Arrange & Act
      render(<HeroSection loginHref="/sign-in" />);

      // Assert
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('Pinterest')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Ideas in.')).toBeInTheDocument();
      expect(screen.getByText('Posts out.')).toBeInTheDocument();
      expect(screen.getByText('Regardless.')).toBeInTheDocument();
      const startCta = screen.getByRole('link', { name: /start a session/i });
      expect(startCta).toHaveAttribute('href', '/sign-in');
    });
  });

  describe('TickerStrip', () => {
    it('renders ticker items', () => {
      // Arrange & Act
      render(<TickerStrip />);

      // Assert
      expect(screen.getByText(/live tech news/i)).toBeInTheDocument();
      expect(screen.getByText(/multi-slide drafts/i)).toBeInTheDocument();
      expect(screen.getByText(/schedule or publish now/i)).toBeInTheDocument();
    });
  });

  describe('IdeateSection', () => {
    it('renders 01 / Ideate section with bullet points and chat mockup', () => {
      // Arrange & Act
      render(<IdeateSection />);

      // Assert
      expect(screen.getByText('01 / Ideate')).toBeInTheDocument();
      expect(
        screen.getByText('Start with a chat, not a blank page.')
      ).toBeInTheDocument();
      expect(screen.getByText(/Pick your platforms/i)).toBeInTheDocument();
      expect(screen.getByText(/Why small models are winning on-device/i)).toBeInTheDocument();
    });
  });

  describe('PipelineSection', () => {
    it('renders the 7 kanban stages', () => {
      // Arrange & Act
      render(<PipelineSection />);

      // Assert
      expect(screen.getByText('04 / Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Ideas')).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
      expect(screen.getByText('Drafted')).toBeInTheDocument();
      expect(screen.getByText('In revision')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Posted')).toBeInTheDocument();
    });
  });
});
