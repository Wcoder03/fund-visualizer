import type {
  FundData,
  FundBasicInfo,
  FundPerformance,
  Holding,
  TrendJudgment,
  ScenarioAnalysis,
  OperationAdvice,
  MarketImpact,
  HoldingStructure,
  ReportData,
  Ranking,
  Conclusions,
  StyleDriftWarning,
} from '../types/fund';

// 解析百分比数值
function parsePercentage(value: string): number {
  const cleaned = value.replace(/[+%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 解析净值
function parseNav(value: string): number {
  const cleaned = value.replace(/[*]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 解析表格行
function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '');
}

// 检查是否是表格分隔行
function isTableSeparator(line: string): boolean {
  return /^\|?[\s-:|]+\|?$/.test(line.trim());
}

// 解析键值对表格（接受二维数组）
function parseKeyValueTable(table: string[][]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const row of table) {
    if (row.length >= 2) {
      result[row[0]] = row[1];
    }
  }
  return result;
}

// 提取章节内容
function extractSection(content: string, header: string): string | null {
  // 转义正则表达式中的特殊字符
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 查找标题位置
  const headerRegex = new RegExp(`#{2,4}\\s*${escapedHeader}`, 'i');
  const headerMatch = content.match(headerRegex);

  if (!headerMatch || headerMatch.index === undefined) return null;

  const startIndex = headerMatch.index;

  // 查找下一个同级或更高级别的标题
  const remainingContent = content.substring(startIndex + headerMatch[0].length);
  const nextHeaderRegex = /\n#{1,4}\s/;
  const nextHeaderMatch = remainingContent.match(nextHeaderRegex);

  const endIndex = nextHeaderMatch && nextHeaderMatch.index !== undefined
    ? startIndex + headerMatch[0].length + nextHeaderMatch.index
    : content.length;

  return content.substring(startIndex, endIndex);
}

// 提取表格
function extractTable(content: string, header: string): string[][] | null {
  const section = extractSection(content, header);
  if (!section) return null;

  const lines = section.split('\n');
  const tableLines = lines.filter(
    (line) => line.includes('|') && !isTableSeparator(line)
  );

  if (tableLines.length < 2) return null;

  return tableLines.map(parseTableRow);
}

// 解析基本信息
function parseBasicInfo(content: string, fundHeader: string): FundBasicInfo {
  const section = extractSection(content, fundHeader) || '';
  const kvTable = extractTable(section, '基本信息') || [];
  const kv = parseKeyValueTable(kvTable);

  return {
    code: kv['基金代码'] || '',
    name: kv['基金名称'] || '',
    company: kv['基金公司'] || '',
    manager: kv['基金经理'] || '',
    managerTenure: kv['任职时间'] || kv['经理任职时间'] || '',
    establishDate: kv['成立日期'] || '',
    scale: kv['基金规模'] || '',
    type: kv['基金类型'] || '',
    riskLevel: kv['风险等级'] || '',
    trackingIndex: kv['跟踪标的'],
    morningstarRating: kv['晨星评级'],
    turnoverRate: kv['换手率'],
  };
}

// 解析业绩表现
function parsePerformance(content: string, fundHeader: string): FundPerformance {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '业绩表现');

  const defaultPerf: FundPerformance = {
    nav: 0,
    return1w: 0,
    return1m: 0,
    return3m: 0,
    return6m: 0,
    return1y: 0,
    returnSinceStart: 0,
    rating: '-',
  };

  if (!table) return defaultPerf;

  const kv: Record<string, string> = {};
  for (const row of table) {
    if (row.length >= 2) {
      kv[row[0]] = row[1];
    }
  }

  return {
    nav: parseNav(kv['最新单位净值'] || '0'),
    return1w: parsePercentage(kv['近1周收益'] || '0'),
    return1m: parsePercentage(kv['近1月收益'] || '0'),
    return3m: parsePercentage(kv['近3月收益'] || '0'),
    return6m: parsePercentage(kv['近6月收益'] || '0'),
    return1y: parsePercentage(kv['近1年收益'] || '0'),
    return3y: kv['近3年收益'] ? parsePercentage(kv['近3年收益']) : undefined,
    returnSinceStart: parsePercentage(kv['成立以来收益'] || '0'),
    rating: (kv['同类对比'] as FundPerformance['rating']) || '-',
  };
}

// 解析持仓
function parseHoldings(content: string, fundHeader: string): Holding[] | undefined {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '重仓股');

  if (!table || table.length < 2) return undefined;

  const holdings: Holding[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 3 && row[0] !== '**合计**') {
      holdings.push({
        rank: parseInt(row[0]) || i,
        stock: row[1],
        percentage: parsePercentage(row[2]),
        industry: row[3] || '',
        market: row[4],
      });
    }
  }

  return holdings.length > 0 ? holdings : undefined;
}

// 解析趋势判断
function parseTrends(content: string, fundHeader: string): TrendJudgment[] {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '趋势判断');

  if (!table || table.length < 2) return [];

  const trends: TrendJudgment[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 7) {
      trends.push({
        period: row[0] as TrendJudgment['period'],
        trend: row[1] as TrendJudgment['trend'],
        confidence: row[2] as TrendJudgment['confidence'],
        basis: row[3],
        catalysts: row[4],
        risks: row[5],
        watchIndicators: row[6],
      });
    }
  }

  return trends;
}

// 解析情景分析
function parseScenarios(content: string, fundHeader: string): ScenarioAnalysis[] | undefined {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '情景分析');

  if (!table || table.length < 2) return undefined;

  const scenarios: ScenarioAnalysis[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 5) {
      scenarios.push({
        scenario: row[0] as ScenarioAnalysis['scenario'],
        trigger: row[1],
        performance: row[2],
        indicator: row[3],
        strategy: row[4],
      });
    }
  }

  return scenarios.length > 0 ? scenarios : undefined;
}

// 解析操作建议
function parseAdvice(content: string, fundHeader: string): OperationAdvice[] {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '操作建议');

  if (!table || table.length < 2) return [];

  const advice: OperationAdvice[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 4) {
      advice.push({
        investorType: row[0],
        suitable: row[1],
        position: row[2],
        advice: row[3],
      });
    }
  }

  return advice;
}

// 解析市场环境影响
function parseMarketImpact(content: string, fundHeader: string): MarketImpact[] | undefined {
  const section = extractSection(content, fundHeader) || '';
  const table = extractTable(section, '市场环境影响');

  if (!table || table.length < 2) return undefined;

  const impacts: MarketImpact[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 3) {
      impacts.push({
        factor: row[0],
        impact: row[1],
        direction: row[2] as MarketImpact['direction'],
      });
    }
  }

  return impacts.length > 0 ? impacts : undefined;
}

// 解析持仓结构
function parseHoldingStructure(content: string, fundHeader: string): HoldingStructure | undefined {
  const section = extractSection(content, fundHeader) || '';
  const kvTable = extractTable(section, '持仓结构分析');

  if (!kvTable) return undefined;

  const kv = parseKeyValueTable(kvTable);
  return {
    coreTrack: kv['核心赛道'],
    industryDistribution: kv['行业分布'],
    marketDistribution: kv['市场分布'],
    investmentStyle: kv['投资风格'],
    concentration: kv['集中度'],
  };
}

// 解析风格漂移警告
function parseStyleDrift(content: string, fundHeader: string): StyleDriftWarning | undefined {
  const section = extractSection(content, fundHeader) || '';
  if (!section.includes('风格漂移警告')) return undefined;

  const kvTable = extractTable(section, '风格漂移警告');
  if (!kvTable) return undefined;

  const kv = parseKeyValueTable(kvTable);
  return {
    fundName: kv['基金名称'] || '',
    actualHolding: kv['实际持仓'] || '',
    driftLevel: kv['漂移程度'] || '',
    riskNote: kv['风险提示'] || '',
  };
}

// 解析综合对比表
function parseComparisonTable(content: string): FundData[] {
  const section = extractSection(content, '多基金横向对比') || '';
  const table = extractTable(section, '综合对比表');

  if (!table || table.length < 2) return [];

  const funds: FundData[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 14) {
      funds.push({
        basicInfo: {
          code: row[0],
          name: row[1],
          company: '',
          manager: '',
          managerTenure: '',
          establishDate: '',
          scale: '',
          type: row[2],
          riskLevel: '',
        },
        performance: {
          nav: 0,
          return1w: 0,
          return1m: 0,
          return3m: 0,
          return6m: 0,
          return1y: 0,
          returnSinceStart: 0,
          rating: '-',
        },
        trends: [
          { period: '短期（1个月）', trend: row[5] as TrendJudgment['trend'], confidence: '中', basis: '', catalysts: '', risks: '', watchIndicators: '' },
          { period: '中期（3-6个月）', trend: row[6] as TrendJudgment['trend'], confidence: '中', basis: '', catalysts: '', risks: '', watchIndicators: '' },
          { period: '长期（1年以上）', trend: row[7] as TrendJudgment['trend'], confidence: '中', basis: '', catalysts: '', risks: '', watchIndicators: '' },
        ],
        advice: [],
        score: parseFloat(row[13]) || 0,
      });
    }
  }

  return funds;
}

// 解析排序结果
function parseRankings(content: string): Ranking[] {
  const section = extractSection(content, '排序结果') || '';
  const table = extractTable(section, '排序结果');

  if (!table || table.length < 2) return [];

  const rankings: Ranking[] = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length >= 4) {
      rankings.push({
        dimension: row[0],
        code: row[1],
        name: row[2],
        reason: row[3],
      });
    }
  }

  return rankings;
}

// 解析最终结论
function parseConclusions(content: string): Conclusions {
  const parseConclusionTable = (header: string): { code: string; name: string; reason: string }[] => {
    const table = extractTable(content, header);
    if (!table || table.length < 2) return [];

    const items: { code: string; name: string; reason: string }[] = [];
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (row.length >= 3) {
        items.push({
          code: row[0],
          name: row[1],
          reason: row[2],
        });
      }
    }
    return items;
  };

  const parseLongTermTable = (): { code: string; name: string; position: string }[] => {
    const table = extractTable(content, '适合长期配置的基金');
    if (!table || table.length < 2) return [];

    const items: { code: string; name: string; position: string }[] = [];
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (row.length >= 3) {
        items.push({
          code: row[0],
          name: row[1],
          position: row[2],
        });
      }
    }
    return items;
  };

  const parseShortTermTable = (): { code: string; name: string; watch: string }[] => {
    const table = extractTable(content, '适合短期观察的基金');
    if (!table || table.length < 2) return [];

    const items: { code: string; name: string; watch: string }[] = [];
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (row.length >= 3) {
        items.push({
          code: row[0],
          name: row[1],
          watch: row[2],
        });
      }
    }
    return items;
  };

  const parseIndicatorsTable = (): { category: string; indicator: string; importance: string }[] => {
    const table = extractTable(content, '后续需要跟踪的关键指标');
    if (!table || table.length < 2) return [];

    const items: { category: string; indicator: string; importance: string }[] = [];
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (row.length >= 3) {
        items.push({
          category: row[0],
          indicator: row[1],
          importance: row[2],
        });
      }
    }
    return items;
  };

  return {
    noteworthy: parseConclusionTable('当前更值得关注的基金'),
    longTerm: parseLongTermTable(),
    shortTerm: parseShortTermTable(),
    notRecommended: parseConclusionTable('暂不建议重仓的基金'),
    keyIndicators: parseIndicatorsTable(),
  };
}

// 提取报告日期
function extractReportDate(content: string): string {
  const match = content.match(/\*?报告生成时间\*?:\s*(\d{4}年\d{1,2}月\d{1,2}日)/);
  return match ? match[1] : '';
}

// 提取数据日期
function extractDataDate(content: string): string {
  const match = content.match(/\*?数据日期\*?:\s*([\d年月日-\s]+)/);
  return match ? match[1].trim() : '';
}

// 提取分析摘要
function extractSummary(content: string): string {
  const section = extractSection(content, '分析摘要');
  if (!section) return '';

  // 移除标题行，保留正文
  const lines = section.split('\n').filter((line) => !line.startsWith('#'));
  return lines.join('\n').trim();
}

// 查找所有基金章节
function findFundSections(content: string): string[] {
  const regex = /###\s*基金\d+[：:]/g;
  const matches = content.match(regex);
  return matches || [];
}

// 主解析函数
export function parseReport(content: string): ReportData {
  const fundSections = findFundSections(content);
  const funds: FundData[] = [];

  for (const sectionHeader of fundSections) {
    const section = extractSection(content, sectionHeader.replace(/###\s*/, ''));
    if (!section) continue;

    const basicInfo = parseBasicInfo(section, '');
    const performance = parsePerformance(section, '');
    const holdings = parseHoldings(section, '');
    const trends = parseTrends(section, '');
    const scenarios = parseScenarios(section, '');
    const advice = parseAdvice(section, '');
    const marketImpact = parseMarketImpact(section, '');
    const holdingStructure = parseHoldingStructure(section, '');
    const styleDrift = parseStyleDrift(section, '');

    // 从排序结果中获取评分
    const rankings = parseRankings(content);
    const ranking = rankings.find((r) => r.code === basicInfo.code);
    const score = ranking ? 7.5 : 0; // 默认评分

    funds.push({
      basicInfo,
      performance,
      holdings,
      trends,
      scenarios,
      advice,
      marketImpact,
      holdingStructure,
      styleDrift,
      score,
    });
  }

  // 如果没有找到单只基金章节，尝试从综合对比表解析
  if (funds.length === 0) {
    const comparisonFunds = parseComparisonTable(content);
    funds.push(...comparisonFunds);
  }

  return {
    date: extractReportDate(content),
    dataDate: extractDataDate(content),
    summary: extractSummary(content),
    funds,
    rankings: parseRankings(content),
    conclusions: parseConclusions(content),
  };
}

// 扫描报告文件列表
export function scanReportFiles(): string[] {
  // 这个函数在实际使用时会被替换为动态扫描
  return [];
}

// 解析报告文件名获取日期
export function parseReportDate(filename: string): string | null {
  const match = filename.match(/基金分析报告_(\d{8})\.md/);
  if (!match) return null;

  const dateStr = match[1];
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
