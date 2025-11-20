/* eslint-env jest */
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders heading for mood-based recommendations', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', {
    level: 1,
    name: /temukan film yang cocok dengan mood kamu/i,
  });
  expect(headingElement).toBeInTheDocument();
});
