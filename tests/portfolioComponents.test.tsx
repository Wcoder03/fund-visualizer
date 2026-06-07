import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HoldingSummary from '../src/components/HoldingSummary';
import PortfolioHoldingsTable from '../src/components/PortfolioHoldingsTable';
import ProfitLossValue from '../src/components/ProfitLossValue';
import type { FundNavSnapshot, PortfolioHolding } from '../src/types/portfolio';

const holdingA: PortfolioHolding = {
  id: 'a',
  fundCode: '001',
  fundName: '测试基金A',
  holdingShares: 100,
  costAmount: 100,
  costNav: 1,
  firstBuyDate: '2026-01-01',
  holdingDays: 10,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const holdingB: PortfolioHolding = {
  id: 'b',
  fundCode: '002',
  fundName: '测试基金B',
  holdingShares: 200,
  costAmount: 300,
  costNav: 1.5,
  firstBuyDate: '2026-01-01',
  holdingDays: 20,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const snapshotA: FundNavSnapshot = {
  fundCode: '001',
  fundName: '测试基金A',
  previousNav: 1,
  latestConfirmedNav: 1.2,
  confirmedNav: 1.2,
  navDate: '2026-06-05',
  estimatedNavDate: '2026-06-05',
  intradayChangeRate: 0,
  marketStatus: 'nav_confirmed',
  dataSource: 'eastmoney',
  dataStatus: 'confirmed',
};

const snapshotB: FundNavSnapshot = {
  fundCode: '002',
  fundName: '测试基金B',
  previousNav: 1.4,
  latestConfirmedNav: 1.5,
  estimatedNav: 1.6,
  navDate: '2026-06-05',
  estimatedNavDate: '2026-06-05',
  intradayChangeRate: 0,
  marketStatus: 'trading',
  dataSource: 'mock',
  dataStatus: 'fallback',
};

describe('portfolio components', () => {
  it('renders empty summary normally', () => {
    render(<HoldingSummary holdings={[]} />);
    expect(screen.getByText('持仓总览')).toBeInTheDocument();
    expect(screen.getByText('0 只')).toBeInTheDocument();
  });

  it('renders profit/loss value colors and text', () => {
    const { rerender } = render(<ProfitLossValue value={12.3} type="money" />);
    expect(screen.getByText('+12.30')).toHaveClass('text-red-600');
    rerender(<ProfitLossValue value={-1.2} type="money" />);
    expect(screen.getByText('-1.20')).toHaveClass('text-green-600');
    rerender(<ProfitLossValue value={0} type="money" />);
    expect(screen.getByText('0.00')).toHaveClass('text-slate-500');
    rerender(<ProfitLossValue value={null} type="money" />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders empty holdings table', () => {
    render(
      <PortfolioHoldingsTable
        holdings={[]}
        snapshotsByFundCode={{}}
        errorsByFundCode={{}}
        sortField="marketValue"
        sortDirection="desc"
        onSortChange={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('暂无持仓')).toBeInTheDocument();
    expect(screen.getByText('添加基金代码、持有金额和持有收益后，即可开始分析')).toBeInTheDocument();
  });

  it('renders fallback and confirmed status in table', () => {
    render(
      <PortfolioHoldingsTable
        holdings={[holdingA, holdingB]}
        snapshotsByFundCode={{ '001': snapshotA, '002': snapshotB }}
        errorsByFundCode={{}}
        sortField="marketValue"
        sortDirection="desc"
        onSortChange={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('当日确认')).toBeInTheDocument();
    expect(screen.getByText('盘中估算')).toBeInTheDocument();
    expect(screen.getByText('演示数据')).toBeInTheDocument();
  });

  it('emits sort changes from table header', () => {
    const onSortChange = vi.fn();
    render(
      <PortfolioHoldingsTable
        holdings={[holdingA]}
        snapshotsByFundCode={{ '001': snapshotA }}
        errorsByFundCode={{}}
        sortField="marketValue"
        sortDirection="desc"
        onSortChange={onSortChange}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('持有收益'));
    expect(onSortChange).toHaveBeenCalledWith('totalProfitLoss');
  });

  it('opens DCA settings from the table', () => {
    render(
      <PortfolioHoldingsTable
        holdings={[holdingA]}
        snapshotsByFundCode={{ '001': snapshotA }}
        errorsByFundCode={{}}
        sortField="marketValue"
        sortDirection="desc"
        onSortChange={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('设置'));
    expect(screen.getByText('定投设置')).toBeInTheDocument();
    expect(screen.getByText('启用定投计划')).toBeInTheDocument();
  });
});
