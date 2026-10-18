; VC++ Redistributable for school PCs (Postgres initdb exit 0xC0000135).
; electron-builder packs resources into INSTDIR/resources/resources
!macro customInstall
  IfFileExists "$INSTDIR\resources\resources\vc_redist.x64.exe" 0 aurent_try_flat
    DetailPrint "Installing Microsoft Visual C++ Redistributable (x64)"
    ExecWait '"$INSTDIR\resources\resources\vc_redist.x64.exe" /install /quiet /norestart' $0
    DetailPrint "VC++ Redistributable exit code $0"
    Goto aurent_vcredist_done
  aurent_try_flat:
  IfFileExists "$INSTDIR\resources\vc_redist.x64.exe" 0 aurent_vcredist_done
    DetailPrint "Installing Microsoft Visual C++ Redistributable (x64)"
    ExecWait '"$INSTDIR\resources\vc_redist.x64.exe" /install /quiet /norestart' $0
    DetailPrint "VC++ Redistributable exit code $0"
  aurent_vcredist_done:
!macroend
