import { useAuth } from '../../hooks/useAuth';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            GDPR Compliant • Data automatically deleted per retention policy • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
