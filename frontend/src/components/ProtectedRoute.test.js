import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

function renderWithRouter(element, initialPath = '/private') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/private" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated={false} authLoading={false}>
        <div>Private Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated authLoading={false}>
        <div>Private Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
