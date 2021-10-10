!include MUI2.nsh
!include nsDialogs.nsh
!include 'StdUtils.nsh'

!define GC_INSTALLER "gc-driver-install.exe"

; The result of whether we should install drivers or not
var InstallType

!macro customPageAfterChangeDir

  Page custom InstTypePageCreate
  Function InstTypePageCreate
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
    ${If} $InstallType == INSTALL
        ${NSD_Check} $2 ; Select install drivers
    ${Else}
        ${NSD_Check} $1 ; Select skip by default
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 30u "Would you like to also install GameCube adapter drivers? This would allow you to use GameCube controllers with a compatible adapter (in Switch/Wii U mode) on your PC. Skip this if you already have GameCube adapter drivers installed."
    pop $3
    nsDialogs::Show
  FunctionEnd

!macroend

!macro customFinishPage

  Page custom InstTypePageLeave
  Function InstTypePageLeave
    ; https://github.com/electron-userland/electron-builder/blob/7327025ad0a63ec999ade43347e5c8ffea90e08b/packages/app-builder-lib/templates/nsis/assistedInstaller.nsh#L54-L60
    ; this triggers the app opening when the installer reaches the final page which doesn't really exist
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

!macroend

!macro customInstall
  ; Add slippi URI Handling
  DetailPrint "Register slippi URI Handler"
  DeleteRegKey HKCR "slippi"
  WriteRegStr HKCR "slippi" "" "URL:slippi"
  WriteRegStr HKCR "slippi" "URL Protocol" ""
  WriteRegStr HKCR "slippi\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "slippi\shell" "" ""
  WriteRegStr HKCR "slippi\shell\Open" "" ""
  WriteRegStr HKCR "slippi\shell\Open\command" "" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\""

  ; Check if we should also install the GC drivers
  ${If} $InstallType == INSTALL
    ; Automatically run gamecube adapter driver installer
    File /oname=$PLUGINSDIR\${GC_INSTALLER} "${BUILD_RESOURCES_DIR}\${GC_INSTALLER}"
    ExecShellWait "" "$PLUGINSDIR\${GC_INSTALLER}" SW_HIDE
  ${EndIf}
!macroend