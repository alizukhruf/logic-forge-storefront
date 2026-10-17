import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const signedIn = await register(name, email, password);
      if (signedIn) navigate('/');
      else setMessage('Check your email to confirm your account, then sign in.');
    } catch (err: any) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[65vh] max-w-5xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
      <div className="hidden overflow-hidden rounded-3xl bg-brand-950 p-8 text-white md:block lg:p-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Join Logic Forge</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight lg:text-4xl">Your next favorite piece of tech is waiting.</h2>
        <p className="mt-4 text-sm leading-6 text-blue-100">Create an account to keep your wishlist and order history together.</p>
        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=80" alt="" className="mt-8 h-52 w-full rounded-2xl object-cover opacity-90 lg:h-64" />
      </div>
      <div className="lf-panel mx-auto w-full max-w-md p-6 sm:p-8">
        <span className="lf-eyebrow">Get started</span>
        <h1 className="font-display text-2xl font-extrabold text-brand-950">Create your account</h1>
        <p className="mt-2 text-sm text-gray-500">Join Logic Forge to save products and view orders.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Full name
            <input required autoComplete="name" placeholder="Your name" value={name}
              onChange={(e) => setName(e.target.value)} className="lf-input mt-1.5" />
          </label>
          <label className="block text-sm font-semibold text-gray-700">Email
            <input required type="email" autoComplete="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="lf-input mt-1.5" />
          </label>
          <label className="block text-sm font-semibold text-gray-700">Password
            <span className="relative mt-1.5 block">
              <input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} className="lf-input pr-20" />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute inset-y-0 right-3 text-xs font-semibold text-brand-700 hover:text-brand-950">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <button type="submit" disabled={submitting} className="lf-button-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
