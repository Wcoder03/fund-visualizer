const FORBIDDEN_TERMS = ['必涨', '必跌', '稳赚', '保本', '一定上涨', '一定盈利', '保证收益', '无风险', '零风险', '稳赚不赔'];

const REPLACEMENTS: Record<string, string> = {
  必涨: '可能上涨',
  必跌: '可能下跌',
  稳赚: '存在收益不确定性',
  保本: '需关注本金波动',
  一定上涨: '存在上涨可能',
  一定盈利: '存在盈利可能',
  保证收益: '收益存在不确定性',
  无风险: '风险较低但仍需谨慎',
  零风险: '风险较低但仍需谨慎',
  稳赚不赔: '盈亏存在不确定性',
};

export const DISCLAIMER_TEXT =
  '本工具生成的内容仅用于基金研究和信息整理，不构成任何投资建议或收益承诺。基金有风险，投资需谨慎。历史业绩不代表未来表现。';

export function sanitizeText(value: string): string {
  return FORBIDDEN_TERMS.reduce((text, term) => {
    return text.replaceAll(term, REPLACEMENTS[term]);
  }, value);
}

export function sanitizeObject<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeObject(item)])
    ) as T;
  }

  return value;
}
