@echo off
chcp 65001 >nul

:: 复制最新的基金分析报告到可视化项目的public目录
echo 正在更新报告文件...

:: 设置源目录和目标目录
set "SOURCE_DIR=c:\Users\Wang ZX\Desktop\Everything\claude_code_file\jj_analysis"
set "TARGET_DIR=c:\Users\Wang ZX\Desktop\Everything\claude_code_file\jj_analysis\fund-visualizer\public\reports"

:: 清空目标目录
del /q "%TARGET_DIR%\*.md" 2>nul

:: 复制所有报告文件
for %%f in ("%SOURCE_DIR%\基金分析报告_*.md") do (
    copy "%%f" "%TARGET_DIR%\" >nul
    echo 已复制: %%~nxf
)

echo 更新完成！
pause
