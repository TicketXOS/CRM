#!/bin/bash

# Script triển khai Remote MySQL và Migration SQL
# Sử dụng: ./deploy-mysql.sh [options]

set -e  # Dừng khi gặp lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Biến mặc định
DB_HOST=""
DB_PORT="3306"
DB_USER=""
DB_PASSWORD=""
DB_NAME=""
SQL_FILE=""
SQL_DIR="."
BACKUP_DIR="./backups"
BACKUP_ENABLED=true
VERBOSE=false

# Hàm hiển thị help
show_help() {
    echo -e "${BLUE}Script Triển Khai Remote MySQL và Migration SQL${NC}"
    echo ""
    echo "Sử dụng:"
    echo "  ./deploy-mysql.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST          Địa chỉ MySQL server (bắt buộc)"
    echo "  -P, --port PORT          Port MySQL (mặc định: 3306)"
    echo "  -u, --user USER          Tên người dùng MySQL (bắt buộc)"
    echo "  -p, --password PASS      Mật khẩu MySQL (bắt buộc)"
    echo "  -d, --database DB        Tên database (bắt buộc)"
    echo "  -f, --file FILE          File SQL cần chạy (schema.sql, migration.sql, ...)"
    echo "  -D, --dir DIR            Thư mục chứa file SQL (mặc định: .)"
    echo "  -b, --backup-dir DIR     Thư mục lưu backup (mặc định: ./backups)"
    echo "  --no-backup              Không tạo backup trước khi chạy"
    echo "  -v, --verbose            Hiển thị log chi tiết"
    echo "  --help                   Hiển thị hướng dẫn này"
    echo ""
    echo "Ví dụ:"
    echo "  # Chạy schema.sql trên remote MySQL"
    echo "  ./deploy-mysql.sh -h 192.168.1.100 -u root -p password123 -d crm_db -f schema.sql"
    echo ""
    echo "  # Chạy tất cả file SQL trong thư mục migrations"
    echo "  ./deploy-mysql.sh -h 192.168.1.100 -u root -p password123 -d crm_db -D migrations"
    echo ""
    echo "  # Không tạo backup"
    echo "  ./deploy-mysql.sh -h 192.168.1.100 -u root -p password123 -d crm_db -f schema.sql --no-backup"
}

# Hàm log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -f|--file)
            SQL_FILE="$2"
            shift 2
            ;;
        -D|--dir)
            SQL_DIR="$2"
            shift 2
            ;;
        -b|--backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --no-backup)
            BACKUP_ENABLED=false
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Option không hợp lệ: $1"
            show_help
            exit 1
            ;;
    esac
done

# Kiểm tra tham số bắt buộc
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    log_error "Thiếu tham số bắt buộc!"
    show_help
    exit 1
fi

# Kiểm tra MySQL client
if ! command -v mysql &> /dev/null; then
    log_error "MySQL client chưa được cài đặt. Vui lòng cài đặt mysql-client."
    exit 1
fi

# Hàm tạo backup
create_backup() {
    if [ "$BACKUP_ENABLED" = false ]; then
        log_info "Bỏ qua tạo backup (--no-backup được chỉ định)"
        return
    fi

    log_info "Đang tạo backup database..."
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    
    if mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        log_info "Backup thành công: $BACKUP_FILE"
        
        # Nén backup nếu có gzip
        if command -v gzip &> /dev/null; then
            gzip "$BACKUP_FILE"
            log_info "Backup đã được nén: ${BACKUP_FILE}.gz"
        fi
    else
        log_warn "Không thể tạo backup (có thể database chưa tồn tại)"
    fi
}

# Hàm kiểm tra kết nối
check_connection() {
    log_info "Đang kiểm tra kết nối MySQL..."
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &>/dev/null; then
        log_info "Kết nối MySQL thành công!"
        return 0
    else
        log_error "Không thể kết nối đến MySQL server!"
        log_error "Vui lòng kiểm tra:"
        log_error "  - Địa chỉ server: $DB_HOST:$DB_PORT"
        log_error "  - Tên người dùng: $DB_USER"
        log_error "  - Mật khẩu: [đã nhập]"
        log_error "  - Firewall và quyền truy cập"
        return 1
    fi
}

# Hàm tạo database nếu chưa tồn tại
create_database_if_not_exists() {
    log_info "Đang kiểm tra database '$DB_NAME'..."
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" &>/dev/null; then
        log_info "Database '$DB_NAME' đã tồn tại"
    else
        log_info "Database '$DB_NAME' chưa tồn tại, đang tạo..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        log_info "Database '$DB_NAME' đã được tạo"
    fi
}

# Hàm chạy file SQL
run_sql_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        log_error "File không tồn tại: $file"
        return 1
    fi
    
    log_info "Đang chạy file SQL: $file"
    log_debug "Command: mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p[***] $DB_NAME < $file"
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file" 2>&1; then
        log_info "✅ Chạy file SQL thành công: $file"
        return 0
    else
        log_error "❌ Lỗi khi chạy file SQL: $file"
        return 1
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "Script Triển Khai Remote MySQL"
    log_info "=========================================="
    log_info "Server: $DB_HOST:$DB_PORT"
    log_info "Database: $DB_NAME"
    log_info "User: $DB_USER"
    log_debug "Password: [đã ẩn]"
    log_info "=========================================="
    
    # Kiểm tra kết nối
    if ! check_connection; then
        exit 1
    fi
    
    # Tạo database nếu chưa tồn tại
    create_database_if_not_exists
    
    # Tạo backup
    create_backup
    
    # Chạy SQL
    if [ -n "$SQL_FILE" ]; then
        # Chạy file SQL cụ thể
        if [ -f "$SQL_FILE" ]; then
            run_sql_file "$SQL_FILE"
        elif [ -f "$SQL_DIR/$SQL_FILE" ]; then
            run_sql_file "$SQL_DIR/$SQL_FILE"
        else
            log_error "Không tìm thấy file: $SQL_FILE"
            exit 1
        fi
    elif [ -d "$SQL_DIR" ]; then
        # Chạy tất cả file SQL trong thư mục
        log_info "Đang tìm file SQL trong thư mục: $SQL_DIR"
        
        SQL_FILES=$(find "$SQL_DIR" -name "*.sql" -type f | sort)
        
        if [ -z "$SQL_FILES" ]; then
            log_warn "Không tìm thấy file SQL nào trong thư mục: $SQL_DIR"
            exit 1
        fi
        
        for file in $SQL_FILES; do
            run_sql_file "$file"
        done
    else
        log_error "Không có file SQL hoặc thư mục được chỉ định!"
        show_help
        exit 1
    fi
    
    log_info "=========================================="
    log_info "✅ Triển khai hoàn tất!"
    log_info "=========================================="
}

# Chạy main
main

