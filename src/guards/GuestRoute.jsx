import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

/**
 * GuestRoute — wraps /login so authenticated admins can't revisit it.
 * Redirects to dashboard if already logged in.
 */
export default function GuestRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}
