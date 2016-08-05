set sourcedir=%~dp0..\
set targetdir=T:\nala\




del /Q /S %targetdir%input\*.log

copy %sourcedir%nala.js %targetdir% /Y
xcopy %sourcedir%controller\*.* %targetdir%controller\ /E /Y
xcopy %sourcedir%input\*.* %targetdir%input\ /E /Y
xcopy %sourcedir%output\*.* %targetdir%output\ /E /Y