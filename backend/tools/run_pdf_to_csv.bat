@echo off
setlocal

if "%~1"=="" (
  echo Usage: run_pdf_to_csv.bat ^<pdf_or_folder_path^>
  exit /b 1
)

python "%~dp0pdf_to_csv.py" "%~1"
endlocal
