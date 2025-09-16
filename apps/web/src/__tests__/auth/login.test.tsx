import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../../app/(auth)/login/page';
import { useAuthStore } from '../../stores/auth';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Mock auth store
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn()
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockRequestMagicLink = vi.fn();
  const mockClearError = vi.fn();
  const mockResetMagicLinkState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush
    });

    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      magicLinkEmail: null,
      magicLinkSent: false,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });
  });

  it('should render login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /welcome to swift travel/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('should handle email input change', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should call requestMagicLink on form submission', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRequestMagicLink).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should disable form when loading', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      error: null,
      magicLinkEmail: null,
      magicLinkSent: false,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sending magic link/i });
    
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should display error message', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid email address',
      magicLinkEmail: null,
      magicLinkSent: false,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });

    render(<LoginPage />);
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('should show success state after magic link sent', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      magicLinkEmail: 'test@example.com',
      magicLinkSent: true,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });

    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/try a different email address/i)).toBeInTheDocument();
  });

  it('should handle try again action', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      magicLinkEmail: 'test@example.com',
      magicLinkSent: true,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });

    render(<LoginPage />);
    
    const tryAgainButton = screen.getByText(/try a different email address/i);
    fireEvent.click(tryAgainButton);
    
    expect(mockResetMagicLinkState).toHaveBeenCalled();
  });

  it('should redirect if already authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      magicLinkEmail: null,
      magicLinkSent: false,
      requestMagicLink: mockRequestMagicLink,
      clearError: mockClearError,
      resetMagicLinkState: mockResetMagicLinkState
    });

    render(<LoginPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should clear error on component mount', () => {
    render(<LoginPage />);
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('should require email before enabling submit', () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    expect(submitButton).toBeDisabled();
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(submitButton).not.toBeDisabled();
  });
});