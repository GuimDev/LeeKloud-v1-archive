@ECHO OFF
REM BFCPEOPTIONSTART
REM Advanced BAT to EXE Converter www.BatToExeConverter.com
REM BFCPEEXE=C:\Users\Guillaume\Desktop\LeeKloudexe\bin\LeeKloud-Launcher-x64.exe
REM BFCPEICON=C:\Users\Guillaume\Desktop\LeeKloudexe\app.ico
REM BFCPEICONINDEX=1
REM BFCPEEMBEDDISPLAY=1
REM BFCPEEMBEDDELETE=1
REM BFCPEADMINEXE=0
REM BFCPEINVISEXE=0
REM BFCPEVERINCLUDE=1
REM BFCPEVERVERSION=1.2.0.0
REM BFCPEVERPRODUCT=LeeKloud Launcher (x64)
REM BFCPEVERDESC=LeeKloud Launcher (x64)
REM BFCPEVERCOMPANY=GuimDev
REM BFCPEVERCOPYRIGHT=GuimDev
REM BFCPEEMBED=C:\Users\Guillaume\Desktop\LeeKloudexe\nodeLKlauncher.js
REM BFCPEEMBED=C:\Users\Guillaume\Desktop\LeeKloudexe\node-v0.10.29-x64.exe
REM BFCPEOPTIONEND
@ECHO ON
CD %MYFILES%/
node-v0.10.29-x64 nodeLKlauncher.js
node-v0.10.29-x64 -v
pause