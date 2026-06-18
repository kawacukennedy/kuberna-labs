import '@testing-library/jest-dom';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const TEST_TOKEN_KEY = 'k.auth.token';
const TEST_USER_KEY = 'k.auth.user';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

function TestComponent() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>
      <button data-testid="login-btn" onClick={() => login('test-token', { id: '1', email: 'a@b.com', fullName: 'A', roles: ['USER'] })}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts with no user', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  it('restores session from localStorage', async () => {
    localStorage.setItem(TEST_TOKEN_KEY, 'saved-token');
    localStorage.setItem(TEST_USER_KEY, JSON.stringify({ id: '2', email: 'saved@b.com', fullName: 'Saved', roles: ['USER'] }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('saved@b.com');
    expect(screen.getByTestId('token').textContent).toBe('saved-token');
  });

  it('clears corrupted localStorage data', async () => {
    localStorage.setItem(TEST_TOKEN_KEY, 'bad-token');
    localStorage.setItem(TEST_USER_KEY, '{invalid json}');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem(TEST_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(TEST_USER_KEY)).toBeNull();
  });

  it('clears incomplete user data from localStorage', async () => {
    localStorage.setItem(TEST_TOKEN_KEY, 'bad-token');
    localStorage.setItem(TEST_USER_KEY, JSON.stringify({ id: '3' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem(TEST_TOKEN_KEY)).toBeNull();
  });

  it('login sets user and token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-btn'));
    });

    expect(screen.getByTestId('user').textContent).toBe('a@b.com');
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem(TEST_TOKEN_KEY)).toBe('test-token');
    expect(localStorage.getItem(TEST_USER_KEY)).toContain('a@b.com');
  });

  it('logout clears user and token', async () => {
    localStorage.setItem(TEST_TOKEN_KEY, 'saved-token');
    localStorage.setItem(TEST_USER_KEY, JSON.stringify({ id: '1', email: 'a@b.com', fullName: 'A', roles: ['USER'] }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem(TEST_TOKEN_KEY)).toBeNull();
  });

  it('throws error when useAuth is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
