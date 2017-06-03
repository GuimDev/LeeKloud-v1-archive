@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=C:\Users\Guillaume\Desktop\LeeKloudexe\bin\LeeKloud-Launcher-multi.exe
REM BFCPEICON=C:\Users\Guillaume\Desktop\LeeKloudexe\app.ico
REM BFCPEICONINDEX=1
REM BFCPEEMBEDDISPLAY=1
REM BFCPEEMBEDDELETE=1
REM BFCPEADMINEXE=1
REM BFCPEINVISEXE=0
REM BFCPEVERINCLUDE=1
REM BFCPEVERVERSION=1.2.0.0
REM BFCPEVERPRODUCT=LeeKloud Launcher multi
REM BFCPEVERDESC=LeeKloud Launcher multi
REM BFCPEVERCOMPANY=GuimDev
REM BFCPEVERCOPYRIGHT=GuimDev
REM BFCPEEMBED=C:\Users\Guillaume\Desktop\LeeKloudexe\nodeLKlauncher.js
REM BFCPEEMBED=C:\Users\Guillaume\Desktop\LeeKloudexe\node-v0.10.29-x64.exe
REM BFCPEEMBED=C:\Users\Guillaume\Desktop\LeeKloudexe\node-v0.10.29-x86.exe
REM BFCPEOPTIONEND
@ECHO ON
CD %MYFILES%/
@echo OFF
if exist "%SystemRoot%\Sysnative\" goto Wind64
node-v0.10.29-x86 nodeLKlauncher.js
node-v0.10.29-x86 -v
echo:32bit
goto ENDPROG
:Wind64
node-v0.10.29-x64 nodeLKlauncher.js
node-v0.10.29-x64 -v
echo:64bit
goto ENDPROG
:ENDPROG
pause