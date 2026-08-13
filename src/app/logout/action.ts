'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set('user', '', {
    expires: new Date(0),
    path: '/',
  });

  return redirect('/login');
}