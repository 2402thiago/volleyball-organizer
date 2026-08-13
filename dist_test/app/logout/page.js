'use client';
import { logoutAction } from './action';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LogoutPage() {
    const router = useRouter();
    useEffect(() => {
        logoutAction().then(() => {
            // The logout action already redirects to /login, but we can also push to be safe.
            router.push('/login');
        });
    }, []);
    return null;
}
