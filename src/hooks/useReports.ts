import { useState, useEffect, useCallback } from 'react';
import type { ReportData, ReportFile, FundData } from '../types/fund';
import { parseReport, parseReportDate } from '../utils/mdParser';

// 报告文件目录
const REPORTS_DIR = '/reports/';

// 自定义Hook：管理报告数据
export function useReports() {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 从已知文件列表获取报告
  const getReportFilesFromKnownList = useCallback(async (): Promise<ReportFile[]> => {
    const knownFiles = [
      '基金分析报告_20260601.md',
      '基金分析报告_20260527.md',
    ];

    const validFiles: ReportFile[] = [];

    for (const filename of knownFiles) {
      try {
        // 对中文文件名进行URL编码
        const encodedFilename = encodeURIComponent(filename);
        const response = await fetch(REPORTS_DIR + encodedFilename, { method: 'HEAD' });
        if (response.ok) {
          const date = parseReportDate(filename);
          if (date) {
            validFiles.push({
              filename,
              date,
              path: REPORTS_DIR + encodedFilename,
            });
          }
        }
      } catch {
        // 文件不存在，跳过
      }
    }

    return validFiles;
  }, []);

  // 扫描报告文件列表
  const scanReportFiles = useCallback(async () => {
    try {
      // 获取public/reports目录下的所有md文件
      const response = await fetch(REPORTS_DIR);
      if (!response.ok) {
        // 如果无法获取目录列表，尝试直接读取已知的报告文件
        return await getReportFilesFromKnownList();
      }

      const html = await response.text();
      // 解析HTML获取文件列表
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a');
      const mdFiles: ReportFile[] = [];

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('.md')) {
          const filename = decodeURIComponent(href);
          const date = parseReportDate(filename);
          if (date) {
            mdFiles.push({
              filename,
              date,
              path: REPORTS_DIR + href,
            });
          }
        }
      });

      // 按日期降序排序
      mdFiles.sort((a, b) => b.date.localeCompare(a.date));
      return mdFiles;
    } catch (err) {
      console.error('扫描报告文件失败:', err);
      return await getReportFilesFromKnownList();
    }
  }, [getReportFilesFromKnownList]);

  // 加载报告文件列表
  const loadReportList = useCallback(async () => {
    try {
      const files = await scanReportFiles();
      setReports(files);
    } catch (err) {
      setError('加载报告列表失败');
      console.error(err);
    }
  }, [scanReportFiles]);

  // 加载指定日期的报告
  const loadReport = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const reportFile = reports.find((r) => r.date === date);
      if (!reportFile) {
        throw new Error(`未找到 ${date} 的报告文件`);
      }

      // 确保路径已经URL编码
      const encodedPath = reportFile.path.includes('%')
        ? reportFile.path
        : REPORTS_DIR + encodeURIComponent(reportFile.filename);

      const response = await fetch(encodedPath);
      if (!response.ok) {
        throw new Error(`加载报告失败: ${response.status}`);
      }

      const content = await response.text();
      const reportData = parseReport(content);
      setCurrentReport(reportData);
      setSelectedDate(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载报告失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reports]);

  // 加载最新报告
  const loadLatestReport = useCallback(async () => {
    if (reports.length > 0) {
      await loadReport(reports[0].date);
    }
  }, [reports, loadReport]);

  // 获取单只基金数据
  const getFundData = useCallback(
    (code: string): FundData | undefined => {
      return currentReport?.funds.find((f) => f.basicInfo.code === code);
    },
    [currentReport]
  );

  // 初始化时加载报告列表
  useEffect(() => {
    queueMicrotask(() => {
      void loadReportList();
    });
  }, [loadReportList]);

  // 列表加载后自动加载最新报告
  useEffect(() => {
    if (reports.length > 0 && !currentReport) {
      queueMicrotask(() => {
        void loadLatestReport();
      });
    }
  }, [reports, currentReport, loadLatestReport]);

  return {
    reports,
    currentReport,
    loading,
    error,
    selectedDate,
    loadReport,
    loadLatestReport,
    getFundData,
    setSelectedDate,
  };
}
