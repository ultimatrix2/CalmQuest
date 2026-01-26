@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"
cd /d "%~dp0"
.\mvnw.cmd spring-boot:run
