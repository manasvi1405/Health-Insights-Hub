import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Camera, Clock, User, PhoneCall } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-t";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  const [location] = useLocation();
  const { token } = useAuth();
  const { t } = useT();

  const navItems = [
    { icon: Home, key: "nav.home", path: "/home" },
    { icon: Camera, key: "nav.scan", path: "/scan" },
    { icon: Clock, key: "nav.reminders", path: "/reminders" },
    { icon: User, key: "nav.profile", path: "/profile" },
  ];

  return (
    <div className="mobile-container relative bg-slate-50 min-h-[100dvh]">
      {/* Top Header with Logo */}
      {token && (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-2.5 flex justify-end items-center">
          <Link href="/home">
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="font-bold text-slate-800 text-base hidden sm:inline">SehatSaathi</span>
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg leading-none">S</span>
              </div>
            </div>
          </Link>
        </header>
      )}

      <main className="pb-24 pt-3 px-4">
        {children}
      </main>

      {/* Sticky SOS Button */}
      {token && (
        <Link href="/sos">
          <div
            className="fixed bottom-24 right-4 w-16 h-16 bg-destructive rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 animate-pulse border-4 border-white"
            style={{ animationDuration: '2s' }}
          >
            <PhoneCall className="w-8 h-8 text-white" />
          </div>
        </Link>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && token && (
        <nav className="fixed bottom-0 w-full max-w-[390px] bg-white border-t border-slate-200 flex justify-around items-center h-20 px-2 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center justify-center w-16 h-full cursor-pointer ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                  <Icon className={`w-7 h-7 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className={`text-[11px] font-medium ${isActive ? 'font-bold' : ''}`}>{t(item.key)}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
