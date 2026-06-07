import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/', label: '我的持仓' },
  { path: '/analysis', label: '分析工作台' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold tracking-tight text-white shadow-sm">
              FA
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Fund Analysis
              </span>
              <span className="block text-base font-semibold text-slate-950">基金趋势研究台</span>
            </span>
          </Link>

          <nav className="flex w-fit gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="px-4 py-7 lg:px-6">
        {children}
      </main>
    </div>
  );
}
