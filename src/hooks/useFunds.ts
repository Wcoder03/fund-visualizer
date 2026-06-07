import { useState, useEffect, useCallback } from 'react';
import type {
  FundData,
  FundBasicInfo,
  FundPerformance,
  TrendJudgment,
  ScenarioAnalysis,
  OperationAdvice,
  MarketImpact,
} from '../types/fund';

// 报告文件路径（URL编码）
const REPORT_PATH = '/reports/%E5%9F%BA%E9%87%91%E5%88%86%E6%9E%90%E6%8A%A5%E5%91%8A_20260601.md';

// 最终结论数据结构
export interface Conclusions {
  noteworthy: { code: string; name: string; reason: string }[];
  longTerm: { code: string; name: string; position: string }[];
  shortTerm: { code: string; name: string; watch: string }[];
  notRecommended: { code: string; name: string; reason: string }[];
  keyIndicators: { category: string; indicator: string; importance: string }[];
}

// 解析最终结论
function parseConclusions(content: string): Conclusions {
  const conclusions: Conclusions = {
    noteworthy: [],
    longTerm: [],
    shortTerm: [],
    notRecommended: [],
    keyIndicators: [],
  };

  // 找到最终结论部分
  const conclusionStart = content.indexOf('## 四、最终结论');
  if (conclusionStart === -1) return conclusions;

  const conclusionContent = content.substring(conclusionStart);

  // 解析当前更值得关注的基金
  const noteworthyMatch = conclusionContent.match(/###\s*当前更值得关注的基金[\s\S]*?(?=###|$)/);
  if (noteworthyMatch) {
    const lines = noteworthyMatch[0].split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('基金代码')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        conclusions.noteworthy.push({
          code: cells[0],
          name: cells[1],
          reason: cells[2],
        });
      }
    }
  }

  // 解析适合长期配置的基金
  const longTermMatch = conclusionContent.match(/###\s*适合长期配置的基金[\s\S]*?(?=###|$)/);
  if (longTermMatch) {
    const lines = longTermMatch[0].split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('基金代码')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        conclusions.longTerm.push({
          code: cells[0],
          name: cells[1],
          position: cells[2],
        });
      }
    }
  }

  // 解析适合短期观察的基金
  const shortTermMatch = conclusionContent.match(/###\s*适合短期观察的基金[\s\S]*?(?=###|$)/);
  if (shortTermMatch) {
    const lines = shortTermMatch[0].split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('基金代码')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        conclusions.shortTerm.push({
          code: cells[0],
          name: cells[1],
          watch: cells[2],
        });
      }
    }
  }

  // 解析暂不建议重仓的基金
  const notRecommendedMatch = conclusionContent.match(/###\s*暂不建议重仓的基金[\s\S]*?(?=###|$)/);
  if (notRecommendedMatch) {
    const lines = notRecommendedMatch[0].split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('基金代码')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        conclusions.notRecommended.push({
          code: cells[0],
          name: cells[1],
          reason: cells[2],
        });
      }
    }
  }

  // 解析后续需要跟踪的关键指标
  const indicatorsMatch = conclusionContent.match(/###\s*后续需要跟踪的关键指标[\s\S]*?(?=---|$)/);
  if (indicatorsMatch) {
    const lines = indicatorsMatch[0].split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('指标类别')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        conclusions.keyIndicators.push({
          category: cells[0],
          indicator: cells[1],
          importance: cells[2],
        });
      }
    }
  }

  return conclusions;
}

// 解析md文件中的基金数据
function parseReportContent(content: string): { funds: FundData[]; conclusions: Conclusions } {
  const funds: FundData[] = [];

  // 找到所有基金章节
  const fundSections = content.split(/(?=###\s*基金\d+[：:])/);

  for (const section of fundSections) {
    if (!section.match(/^###\s*基金\d+[：:]/)) continue;

    const parsedFunds = parseFundSection(section, content);
    funds.push(...parsedFunds);
  }

  // 解析最终结论
  const conclusions = parseConclusions(content);

  return { funds, conclusions };
}

// 解析单只基金章节（支持合并代码如"012920/012922"）
function parseFundSection(section: string, fullContent: string): FundData[] {
  const results: FundData[] = [];

  // 提取基金代码和名称（支持合并代码）
  const headerMatch = section.match(/###\s*基金\d+[：:]\s*(.*?)（(.*?)）/);
  if (!headerMatch) return results;

  const name = headerMatch[1];
  const codeStr = headerMatch[2];

  // 处理合并的基金代码（如 "012920/012922"）
  const codes = codeStr.includes('/') ? codeStr.split('/') : [codeStr];

  // 解析基本信息
  const basicInfo = parseBasicInfo(section, codes[0], name);

  // 解析业绩表现
  const performance = parsePerformance(section);

  // 解析趋势判断
  const trends = parseTrends(section);

  // 解析情景分析
  const scenarios = parseScenarios(section);

  // 解析操作建议
  const advice = parseAdvice(section);

  // 解析市场环境影响
  const marketImpact = parseMarketImpact(section);

  // 解析持仓结构
  const holdingStructure = parseHoldingStructure(section);

  // 为每个基金代码创建条目
  for (const code of codes) {
    const score = getScoreFromComparison(fullContent, code.trim());

    results.push({
      basicInfo: { ...basicInfo, code: code.trim() },
      performance,
      trends,
      scenarios,
      advice,
      marketImpact,
      holdingStructure,
      score,
    });
  }

  return results;
}

// 从综合对比表获取评分
function getScoreFromComparison(content: string, code: string): number {
  const tableStart = content.indexOf('### 综合对比表');
  if (tableStart === -1) return 7.0;

  const tableEnd = content.indexOf('### 排序结果', tableStart);
  const tableContent = tableEnd !== -1
    ? content.substring(tableStart, tableEnd)
    : content.substring(tableStart);

  const lines = tableContent.split('\n');
  for (const line of lines) {
    // 检查行中是否包含该基金代码
    if (line.includes(code)) {
      const cells = line.split('|').map(c => c.trim());
      // 综合评分是最后一列
      const scoreCell = cells[cells.length - 2];
      if (scoreCell) {
        const score = parseFloat(scoreCell);
        if (!isNaN(score)) return score;
      }
    }
  }

  return 7.0;
}

// 解析基本信息
function parseBasicInfo(section: string, code: string, name: string): FundBasicInfo {
  const getFieldValue = (field: string): string => {
    const regex = new RegExp(`\\|\\s*${field}\\s*\\|\\s*(.*?)\\s*\\|`);
    const match = section.match(regex);
    return match ? match[1].trim() : '';
  };

  const getFundType = (fundName: string): string => {
    if (fundName.includes('ETF联接') || fundName.includes('ETF')) return '指数型-股票';
    if (fundName.includes('QDII')) return 'QDII';
    if (fundName.includes('混合')) return '混合型';
    if (fundName.includes('股票')) return '股票型';
    return '其他';
  };

  return {
    code,
    name: getFieldValue('基金名称') || name,
    company: getFieldValue('基金公司'),
    manager: getFieldValue('基金经理'),
    managerTenure: '',
    establishDate: getFieldValue('成立日期'),
    scale: getFieldValue('基金规模'),
    type: getFieldValue('基金类型') || getFundType(name),
    riskLevel: getFieldValue('风险等级') || '中高风险',
    trackingIndex: getFieldValue('跟踪标的'),
    morningstarRating: getFieldValue('晨星评级'),
  };
}

// 解析业绩表现
function parsePerformance(section: string): FundPerformance {
  const getReturn = (label: string): number => {
    const regex = new RegExp(`\\|\\s*${label}\\s*\\|\\s*([+-]?\\d+\\.?\\d*)%?`);
    const match = section.match(regex);
    return match ? parseFloat(match[1]) : 0;
  };

  const navMatch = section.match(/\|\s*最新单位净值\s*\|\s*(\d+\.?\d*)/);

  return {
    nav: navMatch ? parseFloat(navMatch[1]) : 0,
    return1w: getReturn('近1周收益'),
    return1m: getReturn('近1月收益'),
    return3m: getReturn('近3月收益'),
    return6m: getReturn('近6月收益'),
    return1y: getReturn('近1年收益'),
    return3y: getReturn('近3年收益') || undefined,
    returnSinceStart: getReturn('成立以来收益'),
    rating: '-',
  };
}

// 解析趋势判断
function parseTrends(section: string): TrendJudgment[] {
  const trends: TrendJudgment[] = [];

  const trendSection = section.match(/####\s*趋势判断[\s\S]*?(?=####|$)/);
  if (!trendSection) return trends;

  const lines = trendSection[0].split('\n');
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 7) {
      trends.push({
        period: cells[0] as TrendJudgment['period'],
        trend: cells[1] as TrendJudgment['trend'],
        confidence: cells[2] as TrendJudgment['confidence'],
        basis: cells[3],
        catalysts: cells[4],
        risks: cells[5],
        watchIndicators: cells[6],
      });
    }
  }

  return trends;
}

// 解析情景分析
function parseScenarios(section: string): ScenarioAnalysis[] {
  const scenarios: ScenarioAnalysis[] = [];

  const scenarioSection = section.match(/####\s*情景分析[\s\S]*?(?=####|$)/);
  if (!scenarioSection) return scenarios;

  const lines = scenarioSection[0].split('\n');
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 5) {
      scenarios.push({
        scenario: cells[0] as ScenarioAnalysis['scenario'],
        trigger: cells[1],
        performance: cells[2],
        indicator: cells[3],
        strategy: cells[4],
      });
    }
  }

  return scenarios;
}

// 解析操作建议
function parseAdvice(section: string): OperationAdvice[] {
  const advice: OperationAdvice[] = [];

  const adviceSection = section.match(/####\s*操作建议[\s\S]*?(?=####|$)/);
  if (!adviceSection) return advice;

  const lines = adviceSection[0].split('\n');
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 4) {
      advice.push({
        investorType: cells[0],
        suitable: cells[1],
        position: cells[2],
        advice: cells[3],
      });
    }
  }

  return advice;
}

// 解析市场环境影响
function parseMarketImpact(section: string): MarketImpact[] {
  const impacts: MarketImpact[] = [];

  const impactSection = section.match(/####\s*市场环境影响[\s\S]*?(?=####|$)/);
  if (!impactSection) return impacts;

  const lines = impactSection[0].split('\n');
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 3) {
      impacts.push({
        factor: cells[0],
        impact: cells[1],
        direction: cells[2] as MarketImpact['direction'],
      });
    }
  }

  return impacts;
}

// 解析持仓结构
function parseHoldingStructure(section: string): Record<string, string> {
  const structure: Record<string, string> = {};

  const structureSection = section.match(/####\s*持仓结构分析[\s\S]*?(?=####|$)/);
  if (!structureSection) return structure;

  const lines = structureSection[0].split('\n');
  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 2) {
      structure[cells[0]] = cells[1];
    }
  }

  return structure;
}

// 默认结论
const defaultConclusions: Conclusions = {
  noteworthy: [],
  longTerm: [],
  shortTerm: [],
  notRecommended: [],
  keyIndicators: [],
};

// 自定义Hook：管理基金数据
export function useFunds() {
  const [funds, setFunds] = useState<FundData[]>([]);
  const [conclusions, setConclusions] = useState<Conclusions>(defaultConclusions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载基金数据
  const loadFunds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(REPORT_PATH);
      if (!response.ok) {
        throw new Error(`加载报告失败: ${response.status}`);
      }

      const content = await response.text();
      const { funds: parsedFunds, conclusions: parsedConclusions } = parseReportContent(content);

      if (parsedFunds.length === 0) {
        throw new Error('未能解析出基金数据');
      }

      setFunds(parsedFunds);
      setConclusions(parsedConclusions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载基金数据失败');
      console.error('加载基金数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取单只基金数据
  const getFundByCode = useCallback(
    (code: string): FundData | undefined => {
      return funds.find((f) => f.basicInfo.code === code);
    },
    [funds]
  );

  // 初始化时加载数据
  useEffect(() => {
    queueMicrotask(() => {
      void loadFunds();
    });
  }, [loadFunds]);

  return {
    funds,
    conclusions,
    loading,
    error,
    loadFunds,
    getFundByCode,
  };
}
