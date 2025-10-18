@echo off
echo ========================================
echo  CommUnity App Rebuild Script
echo ========================================
echo.

echo Step 1: Clearing Expo cache...
call npx expo start -c

echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. UNINSTALL the old CommUnity app from your phone
echo    (Long press app icon and select Uninstall)
echo.
echo 2. After Expo starts, press 'a' to install on Android
echo    OR scan the QR code with Expo Go
echo.
echo 3. Your app will reinstall with the NEW LOGO!
echo.
echo ========================================

pause
