'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export async function loginAction(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');
    // Validate credentials
    let role = null;
    // Check if it's an evaluator (Thiago, Ramon, Douglas)
    const evaluators = ['Thiago', 'Ramon', 'Douglas'];
    if (evaluators.includes(username) && password === username) {
        role = 'evaluator';
    }
    // Check admin credentials from environment variables
    else if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {
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
    }
    else {
        // Admin redirected to consensus page
        return redirect('/consensus');
    }
}
