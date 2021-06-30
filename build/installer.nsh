!define GC_INSTALLER "gc-driver-install.exe"

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

  ; Automatically run gamecube adapter driver installer
  File /oname=$PLUGINSDIR\${GC_INSTALLER} "${BUILD_RESOURCES_DIR}\${GC_INSTALLER}"
  ExecShellWait "" "$PLUGINSDIR\${GC_INSTALLER}" SW_HIDE
!macroend