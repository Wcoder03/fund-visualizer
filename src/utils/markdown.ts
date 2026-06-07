import React from 'react';

// 解析Markdown加粗语法，返回React元素
export function parseMarkdownBold(text: string): React.ReactNode {
  if (!text) return text;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // 移除**并加粗显示
      const boldText = part.slice(2, -2);
      return React.createElement('strong', { key: index, className: 'font-semibold' }, boldText);
    }
    return part;
  });
}

// 清理Markdown语法，返回纯文本
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

// 检查是否包含Markdown加粗语法
export function hasMarkdownBold(text: string): boolean {
  return /\*\*[^*]+\*\*/.test(text);
}
