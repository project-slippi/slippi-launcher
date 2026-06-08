!include MUI2.nsh
!include nsDialogs.nsh
!include StdUtils.nsh

; https://github.com/electron-userland/electron-builder/tree/master/packages/app-builder-lib/templates/nsis
; if future changes need to be made, this is an important reference for what options electron-builder provides
; because their docs aren't all encompassing.

!define GC_INSTALLER "gc-driver-install.exe"
!define VCREDIST_INSTALLER "vc_redist.x64.exe"
!define VCREDIST_URL "https://aka.ms/vs/17/release/vc_redist.x64.exe"

; Whether to install GC adapter drivers
var GCDriverChoice
; Whether to install VC++ Redistributable
var VCRedistChoice

!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

!macro customInit
  ; Force silent mode for updates to make them seamless
  ; while still allowing directory selection for fresh installs
  ${If} ${isUpdated}
    SetSilent silent
  ${EndIf}
!macroend

!macro customPageAfterChangeDir

  ; ============================================================
  ; Custom Install Pages
  ;
  ; To add a new page:
  ;   1. Declare a variable:         var MyFeatureChoice
  ;   2. Add:                        Page custom Page<Name>Create Page<Name>Leave
  ;   3. Implement Create function:  show/hide guard + nsDialogs UI
  ;   4. Implement Leave function:   store choice in $MyFeatureChoice
  ;   5. Consume in customInstall:   ${If} $MyFeatureChoice == INSTALL ... ${EndIf}
  ; ============================================================

  ; ---- Page: GameCube Adapter Drivers ----
  Page custom PageGCDriverCreate PageGCDriverLeave
  Function PageGCDriverCreate
    ${If} ${isUpdated}
      Abort
    ${EndIf}
    !insertmacro MUI_HEADER_TEXT "Select components to install" ""
    nsDialogs::Create /NOUNLOAD 1018
    Pop $0
    ${NSD_CreateRadioButton} 0 50u 100% 10u "Only install Slippi Launcher"
    pop $1
    ${NSD_CreateRadioButton} 0 70u 100% 10u "Also install GameCube adapter drivers (optional)"
    pop $2
    ${If} $GCDriverChoice == INSTALL
        ${NSD_Check} $2
    ${Else}
        ${NSD_Check} $1
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 30u "Would you like to also install GameCube adapter drivers? This would allow you to use GameCube controllers with a compatible adapter (in Switch/Wii U mode) on your PC. Skip this if you already have GameCube adapter drivers installed."
    pop $3
    nsDialogs::Show
  FunctionEnd

  Function PageGCDriverLeave
    ${NSD_GetState} $1 $0
    ${If} $0 = ${BST_CHECKED}
      StrCpy $GCDriverChoice SKIP
    ${Else}
      ${NSD_GetState} $2 $0
      ${If} $0 = ${BST_CHECKED}
        StrCpy $GCDriverChoice INSTALL
      ${Else}
      ${EndIf}
    ${EndIf}
  FunctionEnd

  ; ---- Page: Visual C++ Redistributable ----
  Page custom PageVCRedistCreate PageVCRedistLeave
  Function PageVCRedistCreate
    ${If} ${isUpdated}
      Abort
    ${EndIf}
    SetRegView 64
    ReadRegDword $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
    ${If} $0 == 1
      Abort
    ${EndIf}
    !insertmacro MUI_HEADER_TEXT "Visual C++ Redistributable" ""
    nsDialogs::Create /NOUNLOAD 1018
    Pop $0
    ${NSD_CreateRadioButton} 0 50u 100% 10u "Install Visual C++ Redistributable (recommended)"
    pop $1
    ${NSD_CreateRadioButton} 0 70u 100% 10u "Skip"
    pop $2
    ${NSD_Check} $1
    ${NSD_CreateLabel} 0 0 100% 30u "Slippi Dolphin requires the Microsoft Visual C++ Redistributable. Would you like to install it now?"
    pop $3
    nsDialogs::Show
  FunctionEnd

  Function PageVCRedistLeave
    ${NSD_GetState} $1 $0
    ${If} $0 = ${BST_CHECKED}
      StrCpy $VCRedistChoice INSTALL
    ${Else}
      StrCpy $VCRedistChoice SKIP
    ${EndIf}
  FunctionEnd

!macroend

!macro customInstall
  ; Add slippi URI Handling
  DetailPrint "Register slippi URI Handler"
  ${If} $installMode == "all"
    DeleteRegKey HKCR "slippi"
    WriteRegStr HKCR "slippi" "" "URL:slippi"
    WriteRegStr HKCR "slippi" "URL Protocol" ""
    WriteRegStr HKCR "slippi\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    WriteRegStr HKCR "slippi\shell" "" ""
    WriteRegStr HKCR "slippi\shell\Open" "" ""
    WriteRegStr HKCR "slippi\shell\Open\command" "" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\""
  ${Else}
    DeleteRegKey HKCU "SOFTWARE\Classes\slippi"
    WriteRegStr HKCU "SOFTWARE\Classes\slippi" "" "URL:slippi"
    WriteRegStr HKCU "SOFTWARE\Classes\slippi" "URL Protocol" ""
    WriteRegStr HKCU "SOFTWARE\Classes\slippi\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    WriteRegStr HKCU "SOFTWARE\Classes\slippi\shell" "" ""
    WriteRegStr HKCU "SOFTWARE\Classes\slippi\shell\Open" "" ""
    WriteRegStr HKCU "SOFTWARE\Classes\slippi\shell\Open\command" "" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\""
  ${EndIf}

  ; Check if we should also install the GC drivers
  ${If} $GCDriverChoice == INSTALL
    ; Automatically run gamecube adapter driver installer
    File /oname=$PLUGINSDIR\${GC_INSTALLER} "${BUILD_RESOURCES_DIR}\${GC_INSTALLER}"
    ExecShellWait "" "$PLUGINSDIR\${GC_INSTALLER}" SW_HIDE
  ${EndIf}

  ; Check if we should install VC++ Redistributable
  ${If} $VCRedistChoice == INSTALL
    DetailPrint "Downloading Visual C++ Redistributable..."
    inetc::get /USERAGENT "SlippiLauncher" "${VCREDIST_URL}" "$PLUGINSDIR\${VCREDIST_INSTALLER}" /END
    Pop $0
    ${If} $0 != "OK"
      MessageBox MB_ICONEXCLAMATION "Failed to download Visual C++ Redistributable.$\n$\nYou may need to install it manually from:$\n${VCREDIST_URL}"
    ${Else}
      DetailPrint "Installing Visual C++ Redistributable..."
      ExecWait '"$PLUGINSDIR\${VCREDIST_INSTALLER}" /install /passive /norestart' $1
      ${If} $1 != 0
        MessageBox MB_ICONEXCLAMATION "Visual C++ Redistributable installation failed (error code $1).$\n$\nYou may need to install it manually from:$\n${VCREDIST_URL}"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnInstall
  ; Clean up Slippi URI Handling
  DeleteRegKey HKCR "slippi"
  DeleteRegKey HKCU "SOFTWARE\Classes\slippi"

  MessageBox MB_YESNO|MB_DEFBUTTON2|MB_ICONQUESTION "Would you like to also clear Slippi Launcher and Slippi Dolphin application data?" \
    /SD IDNO IDNO Done IDYES Accepted

  Accepted:
    RMDir /r "$APPDATA\${APP_FILENAME}"
    !ifdef APP_PRODUCT_FILENAME
      RMDir /r "$APPDATA\${APP_PRODUCT_FILENAME}"
    !endif
  Done:
!macroend
