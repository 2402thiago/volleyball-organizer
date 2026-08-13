import { cookies } from 'next/headers';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Volleyball Organizer - Evaluator',
  description: 'Evaluate participants for volleyball teams',
};

export default async function EvaluatorLayout({ children, params }: { children: React.ReactNode; params: Promise<{ name: string }> }) {
  const paramsResolved = await params;
  const evaluatorNameFromUrl = paramsResolved.name.charAt(0).toUpperCase() + paramsResolved.name.slice(1).toLowerCase();
  
  // Get user from cookie
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('user')?.value;
  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (e) {
      user = null;
    }
  }
  
  // For security, we should use the name from the cookie to display
  // The middleware already ensures that the URL name matches the cookie name for evaluators
  const evaluatorName = user && user.role === 'evaluator' ? user.name : evaluatorNameFromUrl;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Evaluator: {evaluatorName}
                </h1>
              </div>
            </div>
            <div className="hidden md:flex">
              <div className="ml-10 flex items-baseline space-x-4">
                {/* Navigation links could go here */}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">{children}</div>
        </div>
      </main>
    </div>
  );
}