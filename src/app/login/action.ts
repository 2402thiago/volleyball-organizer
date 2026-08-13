'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(_prevState: any, formData: FormData | { username: string; password: string }) {
  let username: string;
  let password: string;
  if (typeof formData === 'object' && formData !== null && 'username' in formData && 'password' in formData) {
    username = (formData as { username: string; password: string }).username;
    password = (formData as { username: string; password: string }).password;
  } else {
    username = (formData as FormData).get('username') as string;
    password = (formData as FormData).get('password') as string;
  }

  // Validate credentials
  let role: 'evaluator' | 'admin' | null = null;

  // Check if it's an evaluator (Thiago, Ramon, Douglas)
  const lowerUsername = username.toLowerCase();
  if (lowerUsername === 'thiago' && password === 'Thiago') {
    role = 'evaluator';
  } else if (lowerUsername === 'ramon' && password === 'Ramon') {
    role = 'evaluator';
  } else if (lowerUsername === 'douglas' && password === 'Douglas') {
    role = 'evaluator';
  } 
  // Check admin credentials from environment variables
  else if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    role = 'admin';
  }

  if (!role) {
    return { error: 'Invalid username or password' };
  }

  // Set cookie with user info (name and role)
  const cookieStore = await cookies();
  cookieStore.set('user', JSON.stringify({ name: username, role }), {
    httpOnly: false, // Readable by client for displaying name in layout
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });

  // Redirect based on role
  if (role === 'evaluator') {
    return redirect(`/evaluator/${username}`);
  } else {
    // Admin redirected to consensus page
    return redirect('/consensus');
  }
}