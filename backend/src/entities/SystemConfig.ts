import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: 'Tên khóa cấu hình' })
  configKey: string;

  @Column({ type: 'text', comment: 'Giá trị cấu hình' })
  configValue: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'string',
    comment: 'Loại giá trị'
  })
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'text';

  @Column({ length: 100, comment: 'Nhóm cấu hình' })
  configGroup: string;

  @Column({ length: 200, nullable: true, comment: 'Mô tả cấu hình' })
  description?: string;

  @Column({ type: 'boolean', default: true, comment: 'Có bật không' })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Có phải cấu hình hệ thống (không thể xóa)' })
  isSystem: boolean;

  @Column({ type: 'int', default: 0, comment: 'Trọng số sắp xếp' })
  sortOrder: number;

  @CreateDateColumn({ comment: 'Thời gian tạo' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Thời gian cập nhật' })
  updatedAt: Date;

  // Lấy giá trị đã được phân tích
  getParsedValue(): any {
    try {
      switch (this.valueType) {
        case 'number':
          return Number(this.configValue);
        case 'boolean':
          return this.configValue === 'true';
        case 'json':
          return JSON.parse(this.configValue);
        default:
          return this.configValue;
      }
    } catch (error) {
      return this.configValue;
    }
  }

  // Đặt giá trị (tự động chuyển đổi sang chuỗi)
  setParsedValue(value: any): void {
    if (this.valueType === 'json') {
      this.configValue = JSON.stringify(value);
    } else {
      this.configValue = String(value);
    }
  }
}
