import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LogisticsTracking } from './LogisticsTracking';

@Entity('logistics_traces')
export class LogisticsTrace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'ID theo dõi logistics' })
  logisticsTrackingId: number;

  @Column({ type: 'datetime', comment: 'Thời gian lịch sử' })
  traceTime: Date;

  @Column({ length: 200, nullable: true, comment: 'Vị trí lịch sử' })
  location?: string;

  @Column({ type: 'text', comment: 'Mô tả lịch sử' })
  description: string;

  @Column({ length: 50, nullable: true, comment: 'Trạng thái lịch sử' })
  status?: string;

  @Column({ length: 100, nullable: true, comment: 'Người vận hành' })
  operator?: string;

  @Column({ length: 100, nullable: true, comment: 'Số điện thoại' })
  phone?: string;

  @Column({ type: 'json', nullable: true, comment: 'Dữ liệu gốc' })
  rawData?: Record<string, any>;

  @CreateDateColumn({ comment: 'Thời gian tạo' })
  createdAt: Date;

  // Quan hệ liên kết
  @ManyToOne(() => LogisticsTracking, tracking => tracking.traces)
  @JoinColumn({ name: 'logisticsTrackingId' })
  logisticsTracking: LogisticsTracking;
}
