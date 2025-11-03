import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginForm, { type LoginFormProps } from '../LoginForm';

const baseProps: LoginFormProps = {
  email: 'demo@myapp.test',
  password: '12345678',
  rememberMe: true,
  isLoading: false,
  showPassword: false,
  errorMessage: null,
  isSubmitDisabled: false,
  socialButtons: [{ label: 'Google', onClick: jest.fn() }],
  onEmailChange: jest.fn(),
  onPasswordChange: jest.fn(),
  onRememberMeChange: jest.fn(),
  onTogglePassword: jest.fn(),
  onSubmit: jest.fn(),
};

describe('LoginForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits the form when valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...baseProps} />);

    await user.type(screen.getByLabelText(/email/i), ' new');
    expect(baseProps.onEmailChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Ingresar/i }));
    expect(baseProps.onSubmit).toHaveBeenCalled();
  });

  it('toggles password visibility and remember me', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /Mostrar/ }));
    expect(baseProps.onTogglePassword).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/Recordarme/i));
    expect(baseProps.onRememberMeChange).toHaveBeenCalledWith(false);
  });

  it('renders error message and social buttons', () => {
    render(<LoginForm {...baseProps} errorMessage="Credenciales inválidas" />);

    expect(screen.getByText(/Credenciales inválidas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
  });

  it('disables submit when requested', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...baseProps} isSubmitDisabled />);

    await user.click(screen.getByRole('button', { name: /Ingresar/i }));
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });
});
