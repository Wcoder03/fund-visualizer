import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path?: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '核心功能',
    items: [
      { path: '/', label: '我的持仓', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
      { path: '/fund-advisor', label: '选基分析', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 3h3" /></svg> },
      { path: '/analysis', label: '持仓分析', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg> },
    ],
  },
  {
    title: '投资分析',
    items: [
      { label: '基金对比', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>, disabled: true },
      { label: '收益趋势', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>, disabled: true },
      { label: '风险评估', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, disabled: true },
      { label: '定投计划', icon: <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>, disabled: true },
    ],
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 flex w-[200px] flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-blue-500/20">
            FA
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-slate-900 leading-tight">基金分析台</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 mt-px">Fund Analysis</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-slate-100" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2.5 pb-2">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? 'mt-[14px]' : ''}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-[2px]">
                {group.items.map((item) => {
                  const isActive = item.path ? location.pathname === item.path : false;
                  const Wrapper = item.path && !item.disabled ? Link : 'div';
                  return (
                    <Wrapper
                      key={item.label}
                      {...(item.path && !item.disabled ? { to: item.path, onClick: () => setSidebarOpen(false) } : {})}
                      className={`sidebar-link ${isActive ? 'active' : ''} ${item.disabled ? 'cursor-default opacity-40' : ''}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="px-2 pb-2.5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold text-white shadow-sm shadow-blue-500/15">
                U
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-slate-700">当前用户</p>
                <p className="text-[10px] text-slate-400">Fund Analyst</p>
              </div>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-7">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}
