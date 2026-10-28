'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { api, getErrorMessage } from '@/lib/api';
import type { User } from '@/types/portal';  

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState('');
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="flex min-h-[320px] flex-col justify-between bg-leaf-900 p-10 text-white lg:p-20">
        <div className="flex items-center gap-3"><BookOpen /><span className="serif text-2xl">BookLeaf</span></div>
        <div><p className="mb-4 text-xs uppercase tracking-[.22em] text-leaf-100">A home for your work</p>
          <h1 className="serif max-w-xl text-5xl leading-tight">Your books.<br />Your publishing journey.</h1>
          <p className="mt-5 max-w-md text-leaf-100">Track your titles, royalties and conversations with our publishing team.</p></div>
        <p className="text-sm text-leaf-100">Thoughtfully published, together.</p>
      </section>
      <section className="flex items-center p-7 sm:p-14 lg:p-20"><div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold text-leaf-700">AUTHOR & SUPPORT PORTAL</p><h2 className="serif mt-3 text-4xl">Welcome back</h2>
        <p className="mb-8 mt-2 text-gray-600">Sign in to continue to your BookLeaf workspace.</p>
        <Formik initialValues={{ email: '', password: '' }} validationSchema={Yup.object({
          email: Yup.string().email('Enter a valid email').required('Email is required'),
          password: Yup.string().required('Password is required'),
        })} onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try { const response = await api.post('/auth/login', values); onLogin(response.data.user); }
          catch (cause) { setError(getErrorMessage(cause, 'Sign in failed')); }
          finally { setSubmitting(false); }
        }}>
          {({ errors, touched, isSubmitting }) => <Form className="space-y-5">
            <label className="block text-sm font-medium">Email<Field name="email" type="email" autoComplete="username" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-leaf-600" />
              {touched.email && errors.email && <span className="text-xs text-red-700">{errors.email}</span>}</label>
            <label className="block text-sm font-medium">Password<Field name="password" type="password" autoComplete="current-password" placeholder="Your password" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-leaf-600" />
              {touched.password && errors.password && <span className="text-xs text-red-700">{errors.password}</span>}</label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={isSubmitting} className="w-full rounded-xl bg-leaf-700 py-3 font-semibold text-white hover:bg-leaf-900 disabled:opacity-50">{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
          </Form>}
        </Formik>
        <p className="mt-8 text-xs text-gray-500">Use the credentials configured for your seeded account.</p>
      </div></section>
    </main>
  );
}
