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

  it('renders the layout shell styles', () => {
    const { container } = render(
      <LoginLayout hero={<div>Hero Block</div>} form={<div>Form Block</div>} />,
    );

    expect(container.firstChild).toHaveClass('rounded-[32px]');
    expect(screen.getByText('Hero Block').parentElement?.parentElement).toHaveClass(
      'bg-[linear-gradient(145deg,#163f38_0%,#1f5f53_52%,#102b27_100%)]',
    );
  });
});
