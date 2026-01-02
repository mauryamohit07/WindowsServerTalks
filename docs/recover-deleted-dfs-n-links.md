
---
layout: page

title: "Recover Deleted DFS‑N Links"
permalink: /recover-deleted-dfs-n-links/
layout: default

description: Guide to recover deleted DFS Namespace links using Active Directory metadata.
---

# Recover Deleted DFS‑N Links (msDFS‑Linkv2)

This guide explains how to recover **deleted DFS‑N links** by restoring AD objects stored in:



Recover accidently removed namespace folder and targets 

**Summary**:
This article provides a detailed guide on **recovering accidentally deleted DFS namespace links and their targets** using **Active Directory Recycle Bin**. It covers prerequisites, discovery of deleted DFS objects, and explains how to identify the correct **ObjectGUID** for restoration. The guide includes PowerShell scripts to **list deleted links**, export reports to **CSV/TXT**, and perform **bulk restores** with automated logging for auditability. Validation steps and troubleshooting tips ensure successful recovery, while emphasising that full namespace restoration requires prior **DFS configuration backups**.

**Scope:** Domain-based DFS Namespaces (DFS-N) running on Windows Server systems joined to Active Directory, where **Active Directory Recycle Bin** is enabled for object recovery.  

**Does not cover:** DFS Replication (DFS-R) data content recovery or full namespace root restoration—only **DFS link objects and their target metadata** within the namespace configuration.


Note : Only subfolders and targets can be retrieved using below not the accidently deleted complete namespace
For complete namespace rely on the backups 


Step1: Check if something is deleted

**************************************************************************************** 
Import-Module ActiveDirectory
# Define log folder
$LogFolder = "C:\DFSlogs"
if (!(Test-Path -Path $LogFolder)) {
    New-Item -Path $LogFolder -ItemType Directory | Out-Null
    Write-Host "Created folder: $LogFolder"
}

# Current date for age calculation
$CurrentDate = Get-Date

# Search Deleted Objects for DFS links
$DeletedDFSObjects = Get-ADObject `
    -Filter 'ObjectClass -eq "msDFS-Linkv2" -and isDeleted -eq $true' `
    -IncludeDeletedObjects `
    -Properties DistinguishedName, Name, ObjectClass, whenChanged, ObjectGUID

# Prepare data with DeletedOn and Age
$Result = $DeletedDFSObjects | Select-Object `
    Name,
    ObjectClass,
    DistinguishedName,
    @{Name="ObjectGUID"; Expression={$_.ObjectGUID}},
    @{Name="DeletedOn"; Expression={($_.whenChanged).ToString("dd-MMM-yyyy HH:mm")}},
    @{Name="Age"; Expression={
        if ($_.whenChanged) {
            $diff = $CurrentDate - $_.whenChanged
            if ($diff.Days -ge 1) {
                "$($diff.Days) days ago"
            } else {
                "$([math]::Round($diff.TotalHours,1)) hours ago"
            }
        } else {
            "N/A"
        }
    }}

# Show interactive grid view
$Result | Out-GridView -Title "Deleted DFS Links Report"

# Export to TXT
$TxtFile = Join-Path $LogFolder "DFS_DeletedLinks_$(Get-Date -Format 'ddMMyyyy_HHmm').txt"
$Result | Format-Table -AutoSize | Out-String | Set-Content $TxtFile

# Export to CSV
$CsvFile = Join-Path $LogFolder "DFS_DeletedLinks_$(Get-Date -Format 'ddMMyyyy_HHmm').csv"
$Result | Export-Csv $CsvFile -NoTypeInformation

Write-Host "Reports saved to:`nTXT: $TxtFile`nCSV: $CsvFile"

++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

Output be like : 



Also create a file in CSV format for the same 






To restore at bulk. Admin can delete the rows as per date or age which is not required 




***********************************************************************************
Import-Module ActiveDirectory

# Path to the CSV file containing ObjectGUIDs
$CsvFile = "C:\DFSlogs\DFS_DeletedLinks_29102025_0331.csv"       # file created from above 

# Path to the restore log
$LogFile = "C:\DFSlogs\RestoreLog_$(Get-Date -Format 'ddMMyyyy_HHmm').txt"

# Start log
Set-Content -Path $LogFile -Value "DFS Restore Log - $(Get-Date)`r`n"

# Import CSV and read ObjectGUID column
$Entries = Import-Csv -Path $CsvFile

foreach ($entry in $Entries) {
    $guid = $entry.ObjectGUID
    Write-Host "Restoring ObjectGUID: $guid"
    Add-Content -Path $LogFile -Value "Processing ObjectGUID: $guid"

    try {
        # Attempt restore
        Restore-ADObject -Identity $guid

        # Validate restore
        Start-Sleep -Seconds 2
        $restoredObj = Get-ADObject -Filter { ObjectGUID -eq $guid } -ErrorAction SilentlyContinue
        if ($restoredObj) {
            $succMsg = "Successfully restored: $guid"
            Write-Host $succMsg -ForegroundColor Green
            Add-Content -Path $LogFile -Value $succMsg
        } else {
            $failMsg = "Restore attempted but object not found after restore: $guid"
            Write-Host $failMsg -ForegroundColor Red
            Add-Content -Path $LogFile -Value $failMsg
        }
    }
    catch {
        $errMsg = "Failed to restore: $guid - Error: $_"
        Write-Host $errMsg -ForegroundColor Red
        Add-Content -Path $LogFile -Value $errMsg
    }
}

Write-Host "Restore process completed. Log saved to: $LogFile"

************************************************************

Above will restore and give output like 



Restore logs will also get created 


