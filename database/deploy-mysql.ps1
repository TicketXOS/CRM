# Script triển khai Remote MySQL và Migration SQL (PowerShell)
# Sử dụng: .\deploy-mysql.ps1 [parameters]
# Encoding: UTF-8 with BOM
# Lưu ý: File này phải được lưu với encoding UTF-8 with BOM để hiển thị đúng tiếng Việt

# Set encoding for console output
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # Fallback nếu không thể set encoding
}

param(
    [Parameter(Mandatory=$true)]
    [string]$DbHost,
    
    [Parameter(Mandatory=$false)]
    [int]$Port,
    
    [Parameter(Mandatory=$true)]
    [string]$User,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$true)]
    [string]$Database,
    
    [Parameter(Mandatory=$false)]
    [string]$File,
    
    [Parameter(Mandatory=$false)]
    [string]$Dir,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDir,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoBackup,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set default values
if (-not $Port) { $Port = 3306 }
if (-not $Dir) { $Dir = "." }
if (-not $BackupDir) { $BackupDir = ".\backups" }

# Hàm hiển thị help
function Show-Help {
    Write-Host "Script Triển Khai Remote MySQL và Migration SQL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Sử dụng:"
    Write-Host "  .\deploy-mysql.ps1 -DbHost HOST -User USER -Password PASS -Database DB [options]"
    Write-Host ""
    Write-Host "Parameters bắt buộc:"
    Write-Host "  -DbHost HOST        Địa chỉ MySQL server"
    Write-Host "  -User USER          Tên người dùng MySQL"
    Write-Host "  -Password PASS      Mật khẩu MySQL"
    Write-Host "  -Database DB        Tên database"
    Write-Host ""
    Write-Host "Parameters tùy chọn:"
    Write-Host "  -Port PORT          Port MySQL (mặc định: 3306)"
    Write-Host "  -File FILE          File SQL cần chạy"
    Write-Host "  -Dir DIR            Thư mục chứa file SQL (mặc định: .)"
    Write-Host "  -BackupDir DIR      Thư mục lưu backup (mặc định: .\backups)"
    Write-Host "  -NoBackup           Không tạo backup trước khi chạy"
    Write-Host "  -Verbose            Hiển thị log chi tiết"
    Write-Host ""
    Write-Host "Ví dụ:"
    Write-Host "  # Chạy schema.sql trên remote MySQL"
    Write-Host "  .\deploy-mysql.ps1 -DbHost 192.168.1.100 -User root -Password password123 -Database crm_db -File schema.sql"
    Write-Host ""
    Write-Host "  # Chạy tất cả file SQL trong thư mục"
    Write-Host "  .\deploy-mysql.ps1 -DbHost 192.168.1.100 -User root -Password password123 -Database crm_db -Dir migrations"
}

# Hàm log
# Suppress PSScriptAnalyzer warning về approved verbs - đây là helper functions, không phải cmdlets
function Log-Info {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '')]
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Log-Warn {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '')]
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Log-Error {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '')]
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Log-Debug {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '')]
    param([string]$Message)
    if ($Verbose) {
        Write-Host "[DEBUG] $Message" -ForegroundColor Blue
    }
}

# Kiểm tra MySQL client
function Test-MySQLClient {
    try {
        $null = Get-Command mysql -ErrorAction Stop
        return $true
    } catch {
        Log-Error "MySQL client chưa được cài đặt. Vui lòng cài đặt MySQL client."
        return $false
    }
}

# Hàm tạo backup
function New-DatabaseBackup {
    if ($NoBackup) {
        Log-Info "Bỏ qua tạo backup (-NoBackup được chỉ định)"
        return
    }
    
    Log-Info "Đang tạo backup database..."
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $BackupDir "backup_${Database}_${timestamp}.sql"
    
    try {
        $env:MYSQL_PWD = $Password
        $mysqldumpCmd = "mysqldump"
        
        if (-not (Get-Command $mysqldumpCmd -ErrorAction SilentlyContinue)) {
            Log-Warn "mysqldump không được tìm thấy, bỏ qua backup"
            return
        }
        
        & $mysqldumpCmd -h $DbHost -P $Port -u $User $Database | Out-File -FilePath $backupFile -Encoding UTF8
        
        if (Test-Path $backupFile -PathType Leaf) {
            $fileSize = (Get-Item $backupFile).Length
            if ($fileSize -gt 0) {
                Log-Info "Backup thành công: $backupFile"
                
                # Nén backup nếu có Compress-Archive
                try {
                    Compress-Archive -Path $backupFile -DestinationPath "${backupFile}.zip" -Force
                    Remove-Item $backupFile -Force
                    Log-Info "Backup đã được nén: ${backupFile}.zip"
                } catch {
                    Log-Debug "Không thể nén backup (có thể file quá lớn hoặc không có quyền)"
                }
            } else {
                Log-Warn "File backup rỗng, có thể database chưa tồn tại"
                Remove-Item $backupFile -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Log-Warn "Không thể tạo backup (có thể database chưa tồn tại)"
    } finally {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

# Hàm kiểm tra kết nối
function Test-MySQLConnection {
    Log-Info "Đang kiểm tra kết nối MySQL..."
    
    try {
        $env:MYSQL_PWD = $Password
        $null = & mysql -h $DbHost -P $Port -u $User -e "SELECT 1;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Log-Info "Kết nối MySQL thành công!"
            return $true
        } else {
            throw "Kết nối thất bại"
        }
    } catch {
        Log-Error "Không thể kết nối đến MySQL server!"
        Log-Error "Vui lòng kiểm tra:"
        Log-Error "  - Địa chỉ server: ${DbHost}:${Port}"
        Log-Error "  - Tên người dùng: $User"
        Log-Error "  - Mật khẩu: [đã nhập]"
        Log-Error "  - Firewall và quyền truy cập"
        return $false
    } finally {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

# Hàm tạo database nếu chưa tồn tại
function New-DatabaseIfNotExists {
    Log-Info "Đang kiểm tra database '$Database'..."
    
    try {
        $env:MYSQL_PWD = $Password
        $null = & mysql -h $DbHost -P $Port -u $User -e "USE $Database;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Log-Info "Database '$Database' đã tồn tại"
        } else {
            # Database không tồn tại, tạo mới
            Log-Info "Database '$Database' chưa tồn tại, đang tạo..."
            $createResult = & mysql -h $DbHost -P $Port -u $User -e "CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Log-Info "Database '$Database' đã được tạo"
            } else {
                Log-Error "Không thể tạo database: $createResult"
                throw "Không thể tạo database"
            }
        }
    } catch {
        Log-Error "Lỗi khi kiểm tra/tạo database: $_"
        throw
    } finally {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

# Hàm chạy file SQL
function Invoke-SqlFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Log-Error "File không tồn tại: $FilePath"
        return $false
    }
    
    Log-Info "Đang chạy file SQL: $FilePath"
    Log-Debug "Command: mysql -h $DbHost -P $Port -u $User -p[***] $Database < $FilePath"
    
    try {
        $env:MYSQL_PWD = $Password
        Get-Content $FilePath -Raw | & mysql -h $DbHost -P $Port -u $User $Database 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Log-Info "✅ Chạy file SQL thành công: $FilePath"
            return $true
        } else {
            Log-Error "❌ Lỗi khi chạy file SQL: $FilePath"
            return $false
        }
    } catch {
        Log-Error "❌ Lỗi khi chạy file SQL: $FilePath"
        Log-Error $_.Exception.Message
        return $false
    } finally {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Script Triển Khai Remote MySQL" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Log-Info "Server: ${DbHost}:${Port}"
    Log-Info "Database: $Database"
    Log-Info "User: $User"
    Log-Debug "Password: [đã ẩn]"
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Kiểm tra MySQL client
    if (-not (Test-MySQLClient)) {
        exit 1
    }
    
    # Kiểm tra kết nối
    if (-not (Test-MySQLConnection)) {
        exit 1
    }
    
    # Tạo database nếu chưa tồn tại
    New-DatabaseIfNotExists
    
    # Tạo backup
    New-DatabaseBackup
    
    # Chạy SQL
    if ($File) {
        # Chạy file SQL cụ thể
        if (Test-Path $File) {
            Invoke-SqlFile -FilePath $File
        } elseif (Test-Path (Join-Path $Dir $File)) {
            Invoke-SqlFile -FilePath (Join-Path $Dir $File)
        } else {
            Log-Error "Không tìm thấy file: $File"
            exit 1
        }
    } elseif (Test-Path $Dir -PathType Container) {
        # Chạy tất cả file SQL trong thư mục
        Log-Info "Đang tìm file SQL trong thư mục: $Dir"
        
        $sqlFiles = Get-ChildItem -Path $Dir -Filter "*.sql" -File | Sort-Object Name
        
        if ($sqlFiles.Count -eq 0) {
            Log-Warn "Không tìm thấy file SQL nào trong thư mục: $Dir"
            exit 1
        }
        
        foreach ($file in $sqlFiles) {
            Invoke-SqlFile -FilePath $file.FullName
        }
    } else {
        Log-Error "Không có file SQL hoặc thư mục được chỉ định!"
        Show-Help
        exit 1
    }
    
    Write-Host "==========================================" -ForegroundColor Cyan
    Log-Info "✅ Triển khai hoàn tất!"
    Write-Host "==========================================" -ForegroundColor Cyan
}

# Chạy main
Main


