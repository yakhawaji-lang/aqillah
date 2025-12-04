# Setup Instructions After Installation
# ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯ Ø¨Ø¹Ø¯ Ø§Ù„ØªØ«Ø¨ÙŠØª

## What Was Installed
## Ù…Ø§ ØªÙ… ØªØ«Ø¨ÙŠØªÙ‡

âœ“ Java JDK 17 (Eclipse Temurin)
âœ“ Android Studio

## Next Steps
## Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©

### 1. RESTART PowerShell (IMPORTANT!)
### 1. Ø£Ø¹Ø¯ ØªØ´ØºÙŠÙ„ PowerShell (Ù…Ù‡Ù…!)

Close this PowerShell window and open a new one.
Ø£ØºÙ„Ù‚ Ù†Ø§ÙØ°Ø© PowerShell Ù‡Ø°Ù‡ ÙˆØ§ÙØªØ­ ÙˆØ§Ø­Ø¯Ø© Ø¬Ø¯ÙŠØ¯Ø©.

### 2. Set Environment Variables (Run as Administrator)
### 2. Ø¥Ø¹Ø¯Ø§Ø¯ Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦Ø© (Ø´ØºÙ‘Ù„ ÙƒÙ…Ø³Ø¤ÙˆÙ„)

Run PowerShell as Administrator and execute:
Ø´ØºÙ‘Ù„ PowerShell ÙƒÙ…Ø³Ø¤ÙˆÙ„ ÙˆÙ†ÙÙ‘Ø°:

`powershell
npm run android:setup-env
`

Or manually:
Ø£Ùˆ ÙŠØ¯ÙˆÙŠØ§Ù‹:

1. Win + R -> sysdm.cpl -> Advanced -> Environment Variables
2. Add JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot
3. Add ANDROID_HOME = C:\Users\Yahya Khawaji\AppData\Local\Android\Sdk
4. Add to Path: %JAVA_HOME%\bin, %ANDROID_HOME%\platform-tools

### 3. Open Android Studio Once
### 3. Ø§ÙØªØ­ Android Studio Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø©

1. Open Android Studio from Start Menu
2. Choose "Standard" setup
3. Wait for Android SDK to download (10-20 minutes)
4. Click "Finish"

### 4. Verify Installation
### 4. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØªØ«Ø¨ÙŠØª

After restarting PowerShell:
Ø¨Ø¹Ø¯ Ø¥Ø¹Ø§Ø¯Ø© ØªØ´ØºÙŠÙ„ PowerShell:

`powershell
npm run android:check
`

### 5. Complete Android Setup
### 5. Ø¥ÙƒÙ…Ø§Ù„ Ø¥Ø¹Ø¯Ø§Ø¯ Android

`powershell
npm run android:setup
npm run android:build
`

## Java Location
## Ù…ÙˆÙ‚Ø¹ Java

C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot

## Android SDK Location
## Ù…ÙˆÙ‚Ø¹ Android SDK

C:\Users\Yahya Khawaji\AppData\Local\Android\Sdk

(Will be created when you first open Android Studio)
(Ø³ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¤Ù‡ Ø¹Ù†Ø¯ ÙØªØ­ Android Studio Ù„Ø£ÙˆÙ„ Ù…Ø±Ø©)
