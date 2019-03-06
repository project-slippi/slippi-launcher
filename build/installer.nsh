!macro customInstall
  DetailPrint "Register slippi URI Handler"
  DeleteRegKey HKCR "slippi"
  WriteRegStr HKCR "slippi" "" "URL:slippi"
  WriteRegStr HKCR "slippi" "URL Protocol" ""
  WriteRegStr HKCR "slippi\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "slippi\shell" "" ""
  WriteRegStr HKCR "slippi\shell\Open" "" ""
  WriteRegStr HKCR "slippi\shell\Open\command" "" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\""
!macroend