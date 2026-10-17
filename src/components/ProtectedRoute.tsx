import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAdmin, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};
