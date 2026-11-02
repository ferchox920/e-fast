import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegisterForm, { type RegisterFormProps } from '../RegisterForm';

const baseProps: RegisterFormProps = {
  fullName: 'Demo User',
  email: 'demo@myapp.test',
  password: '12345678',
  confirmPassword: '12345678',
  rememberMe: true,
  isLoading: false,
  showPassword: false,
  showConfirmPassword: false,
  errorMessage: null,
  successMessage: null,
  isSubmitDisabled: false,
  socialButtons: [{ label: 'Google', onClick: jest.fn() }],
  onFullNameChange: jest.fn(),
  onEmailChange: jest.fn(),
  onPasswordChange: jest.fn(),
  onConfirmPasswordChange: jest.fn(),
  onRememberMeChange: jest.fn(),
  onTogglePassword: jest.fn(),
  onToggleConfirmPassword: jest.fn(),
  onSubmit: jest.fn(),
};

describe('RegisterForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits when enabled', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));
    expect(baseProps.onSubmit).toHaveBeenCalled();
  });

  it('shows social button', () => {
    render(<RegisterForm {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
  });
});
