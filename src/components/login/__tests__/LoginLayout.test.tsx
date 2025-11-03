import { render, screen } from '@testing-library/react';

import LoginLayout from '../LoginLayout';

describe('LoginLayout', () => {
  it('renders hero and form content', () => {
    render(
      <LoginLayout hero={<div>Hero Content</div>} form={<button type="button">Submit</button>} />,
    );

    expect(screen.getByText('Hero Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('applies dark theme styles', () => {
    const { container } = render(
      <LoginLayout theme="dark" hero={<div>Dark Hero</div>} form={<div>Dark Form</div>} />,
    );

    expect(container.firstChild).toHaveClass('bg-neutral-900');
    expect(screen.getByText('Dark Hero').parentElement).toHaveClass('bg-neutral-900');
    expect(screen.getByText('Dark Form').parentElement).toHaveClass('bg-neutral-950');
  });
});
