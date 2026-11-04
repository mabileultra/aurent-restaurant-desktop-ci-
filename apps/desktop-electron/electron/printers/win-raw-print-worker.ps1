# Долгоживущий RAW-принтер: Add-Type компилируется один раз, задания идут через stdin.
# Вход (строка):  <id>\t<base64 utf8 printerName>\t<base64 data>
# Выход (строка): <id>\tOK  |  <id>\tERR\t<base64 utf8 message>

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class AurentRawPrinter {
  [DllImport("winspool.drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
  public class DOCINFOA {
    public string pDocName;
    public string pOutputFile;
    public string pDataType;
  }
  public static void Send(string printerName, byte[] data) {
    IntPtr h;
    if (!OpenPrinter(printerName, out h, IntPtr.Zero)) {
      throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "OpenPrinter failed");
    }
    try {
      var di = new DOCINFOA { pDocName = "Aurent", pDataType = "RAW" };
      if (!StartDocPrinter(h, 1, di)) {
        throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "StartDocPrinter failed");
      }
      try {
        if (!StartPagePrinter(h)) {
          throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "StartPagePrinter failed");
        }
        try {
          IntPtr buf = Marshal.AllocCoTaskMem(data.Length);
          try {
            Marshal.Copy(data, 0, buf, data.Length);
            int written;
            if (!WritePrinter(h, buf, data.Length, out written) || written != data.Length) {
              throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "WritePrinter failed");
            }
          } finally {
            Marshal.FreeCoTaskMem(buf);
          }
        } finally {
          EndPagePrinter(h);
        }
      } finally {
        EndDocPrinter(h);
      }
    } finally {
      ClosePrinter(h);
    }
  }
}
"@

$utf8 = [System.Text.Encoding]::UTF8
[Console]::Out.WriteLine("READY")
[Console]::Out.Flush()

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if ($line.Length -eq 0) { continue }
  $parts = $line.Split("`t")
  $id = $parts[0]
  try {
    $name = $utf8.GetString([Convert]::FromBase64String($parts[1]))
    $bytes = [Convert]::FromBase64String($parts[2])
    [AurentRawPrinter]::Send($name, $bytes)
    [Console]::Out.WriteLine("$id`tOK")
  } catch {
    $msg = [Convert]::ToBase64String($utf8.GetBytes([string]$_.Exception.Message))
    [Console]::Out.WriteLine("$id`tERR`t$msg")
  }
  [Console]::Out.Flush()
}
