import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';

// Mock the entire @tauri-apps/api/core module before importing anything else
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import App from '../App';
import { invoke } from '@tauri-apps/api/core';

// Get the mocked function
const mockInvoke = vi.mocked(invoke);

// Wrapper component for Mantine provider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('App Component', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockReset();
  });

  test('renders welcome title', () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText('Welcome to Tauri + React')).toBeInTheDocument();
  });

  test('renders all logo images', () => {
    render(<App />, { wrapper: Wrapper });
    
    expect(screen.getByAltText('Vite logo')).toBeInTheDocument();
    expect(screen.getByAltText('Tauri logo')).toBeInTheDocument();
    expect(screen.getByAltText('React logo')).toBeInTheDocument();
  });

  test('renders name input and greet button', () => {
    render(<App />, { wrapper: Wrapper });
    
    expect(screen.getByPlaceholderText('Enter a name...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Greet' })).toBeInTheDocument();
  });

  test('updates input value when typing', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Enter a name...');
    await user.type(input, 'John');
    
    expect(input).toHaveValue('John');
  });

  test('calls greet command when form is submitted', async () => {
    const user = userEvent.setup();
    const expectedGreeting = 'Hello, John! You\'ve been greeted from Rust!';
    
    // Mock the invoke function to return our expected greeting
    mockInvoke.mockResolvedValue(expectedGreeting);
    
    render(<App />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Enter a name...');
    const button = screen.getByRole('button', { name: 'Greet' });
    
    await user.type(input, 'John');
    await user.click(button);
    
    // Verify the Tauri command was called correctly
    expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'John' });
    
    // Wait for the greeting message to appear
    await waitFor(() => {
      expect(screen.getByText(expectedGreeting)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('calls greet command when form is submitted via Enter key', async () => {
    const user = userEvent.setup();
    const expectedGreeting = 'Hello, Jane! You\'ve been greeted from Rust!';
    
    mockInvoke.mockResolvedValue(expectedGreeting);
    
    render(<App />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Enter a name...');
    
    await user.type(input, 'Jane');
    await user.keyboard('[Enter]');
    
    expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'Jane' });
    
    await waitFor(() => {
      expect(screen.getByText(expectedGreeting)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('does not display greeting message initially', () => {
    render(<App />, { wrapper: Wrapper });
    
    expect(screen.queryByText(/Hello/)).not.toBeInTheDocument();
  });

  test('displays greeting message after successful greet call', async () => {
    const user = userEvent.setup();
    const expectedGreeting = 'Hello, Test! You\'ve been greeted from Rust!';
    
    mockInvoke.mockResolvedValue(expectedGreeting);
    
    render(<App />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText('Enter a name...');
    const button = screen.getByRole('button', { name: 'Greet' });
    
    await user.type(input, 'Test');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(expectedGreeting)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});