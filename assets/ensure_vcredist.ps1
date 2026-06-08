<#
Ensures the Microsoft Visual C++ Redistributable (x64) is installed.

Exit Codes:
  0 - VC++ runtime is already installed, or installation completed successfully.
  1 - VC++ installer returned a failure exit code.
  2 - VC++ installer completed, but the runtime could not be detected afterward.

This script checks for the modern Microsoft Visual C++ 2015–2022
Redistributable using the registry key:

  HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64

If the runtime is not installed, the latest installer is downloaded from
Microsoft and executed.
#>

$vcRuntimeKey = "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64"

function Test-VCRedistInstalled {
    $runtime = Get-ItemProperty `
        -Path $vcRuntimeKey `
        -ErrorAction SilentlyContinue

    return ($runtime -and $runtime.Installed -eq 1)
}

# Already installed
if (Test-VCRedistInstalled) {
    exit 0
}

$url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
$out = Join-Path $env:TEMP "VC_redist.x64.exe"

Invoke-WebRequest `
    -Uri $url `
    -OutFile $out

$process = Start-Process `
    -FilePath $out `
    -ArgumentList "/install /passive /norestart" `
    -Wait `
    -PassThru

if ($process.ExitCode -ne 0) {
    exit 1
}

# Verify installation succeeded
if (Test-VCRedistInstalled) {
    exit 0
}

exit 2