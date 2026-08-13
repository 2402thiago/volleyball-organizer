import { NextResponse } from 'next/server';
// This function can be marked `async` if using `await` inside
export function middleware(request) {
    var _a;
    const { pathname } = request.nextUrl;
    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/logout'];
    // Check if the path is public
    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }
    // Get the cookie
    const cookie = (_a = request.cookies.get('user')) === null || _a === void 0 ? void 0 : _a.value;
    let user = null;
    if (cookie) {
        try {
            user = JSON.parse(cookie);
        }
        catch (e) {
            // If cookie is invalid, treat as no user
            user = null;
        }
    }
    // If no user, redirect to login
    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
    // Role-based access control
    const { name, role } = user;
    // Evaluator routes: /evaluator/:name
    if (pathname.startsWith('/evaluator/')) {
        // Extract the evaluator name from the URL
        const evaluatorNameInUrl = pathname.split('/')[2]; // /evaluator/Thiago -> Thiago
        // Check if the user is an evaluator and the name in the URL matches the cookie's user name
        if (role === 'evaluator' && name === evaluatorNameInUrl) {
            return NextResponse.next();
        }
        else {
            // If not, redirect to login (or maybe to their own evaluator page? We'll go to login for simplicity)
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }
    // Admin routes: /consensus and /teams
    if (pathname === '/consensus' || pathname === '/teams') {
        if (role === 'admin') {
            return NextResponse.next();
        }
        else {
            // If not admin, redirect to login
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }
    // For all other routes, if authenticated, allow access (or redirect to login if not? We already handled no user above)
    // Actually, we want to protect all routes except public ones. So if we reach here and the user is authenticated, we allow.
    // But note: we already redirected if no user. So for any other path, if the user is authenticated, we let them through.
    // However, we might want to redirect evaluators and admins to their respective dashboards if they try to access the home page? 
    // The requirement says: "All other routes: redirect to login if not authenticated"
    // We already did that. So we can just allow.
    return NextResponse.next();
}
// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
