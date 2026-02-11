@echo off
title CalmQuest Backend
cd /d "%~dp0"

if not defined JAVA_HOME (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"
    )
)

echo Starting CalmQuest Backend...
.\mvnw.cmd spring-boot:run
pause
