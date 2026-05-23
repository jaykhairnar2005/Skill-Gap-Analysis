import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: () => ({
    showSuccess: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('shows validation error when submitting empty form', async () => {
    render(
      <MemoryRouter>
        <LoginPage onLogin={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Email and password are required.')).toBeInTheDocument();
  });
});
