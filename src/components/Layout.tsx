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

const pageTitleMap: Record<string, { label: string; sub: string }> = {
  '/': { label: '我的持仓', sub: 'Portfolio' },
  '/fund-advisor': { label: '选基分析', sub: 'Fund Advisor' },
  '/analysis': { label: '持仓分析', sub: 'Position Analysis' },
};

function getCurrentPageTitle(pathname: string): { label: string; sub: string } {
  if (pageTitleMap[pathname]) return pageTitleMap[pathname];
  if (pathname.startsWith('/fund/')) return { label: '基金详情', sub: 'Fund Detail' };
  return { label: '基金分析台', sub: 'Fund Analysis' };
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = getCurrentPageTitle(location.pathname);
  const now = new Date();
  const updateTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-blue-600/25">
            FA
          </span>
          <div>
            <span className="block text-[13px] font-semibold text-white/90 leading-tight">基金分析台</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-blue-300/40 mt-px">Fund Analysis</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 pt-3 pb-2">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? 'mt-[16px]' : ''}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.28]">
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
        <div className="px-2.5 pb-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-[10px] font-bold text-blue-200/80">
                U
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white/70">当前用户</p>
                <p className="text-[10px] text-white/25">Fund Analyst</p>
              </div>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b border-slate-200/60 bg-white/90 px-5 backdrop-blur-lg lg:px-7">
          {/* Left: page context */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <p className="text-[15px] font-semibold text-slate-800">{pageTitle.label}</p>
            </div>
          </div>

          {/* Right: status + actions + user */}
          <div className="flex items-center gap-3">
            {/* Sync status */}
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
              <span className="text-[12px] font-medium text-emerald-700">数据已同步</span>
            </div>

            {/* Update time */}
            <span className="hidden text-[12px] text-slate-400 lg:block">更新于 {updateTime}</span>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 text-[12px] font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
              </svg>
              <span className="hidden sm:inline">刷新</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200/80" />

            {/* Date */}
            <span className="hidden text-[12px] font-medium text-slate-400 xl:block">
              {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>

            {/* Notification bell */}
            <button type="button" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>

            {/* User avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-bold text-white shadow-sm shadow-blue-500/20">
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
