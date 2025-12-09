import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { LogisticsTrace } from './LogisticsTrace';

export enum LogisticsStatus {
  PENDING = 'pending',           // Chờ giao hàng
  PICKED_UP = 'picked_up',       // Đã nhận hàng
  IN_TRANSIT = 'in_transit',     // Đang vận chuyển
  OUT_FOR_DELIVERY = 'out_for_delivery', // Đang giao hàng
  DELIVERED = 'delivered',       // Đã ký nhận
  EXCEPTION = 'exception',       // Bưu kiện bất thường
  REJECTED = 'rejected',         // Từ chối
  RETURNED = 'returned'          // Trả lại
}

@Entity('logistics_tracking')
export class LogisticsTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, comment: 'ID đơn hàng' })
  orderId: string;

  @Column({ length: 100, comment: 'Số đơn logistics' })
  trackingNo: string;

  @Column({ length: 50, comment: 'Mã công ty logistics' })
  companyCode: string;

  @Column({ length: 100, comment: 'Tên công ty logistics' })
  companyName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: LogisticsStatus.PENDING,
    comment: 'Trạng thái logistics'
  })
  status: LogisticsStatus;

  @Column({ length: 200, nullable: true, comment: 'Vị trí hiện tại' })
  currentLocation?: string;

  @Column({ type: 'text', nullable: true, comment: 'Mô tả trạng thái' })
  statusDescription?: string;

  @Column({ type: 'datetime', nullable: true, comment: 'Thời gian cập nhật cuối' })
  lastUpdateTime?: Date;

  @Column({ type: 'datetime', nullable: true, comment: 'Thời gian dự kiến giao hàng' })
  estimatedDeliveryTime?: Date;

  @Column({ type: 'datetime', nullable: true, comment: 'Thời gian thực tế giao hàng' })
  actualDeliveryTime?: Date;

  @Column({ length: 100, nullable: true, comment: 'Người nhận' })
  signedBy?: string;

  @Column({ type: 'json', nullable: true, comment: 'Thông tin bổ sung' })
  extraInfo?: Record<string, any>;

  @Column({ type: 'boolean', default: true, comment: 'Có bật đồng bộ tự động không' })
  autoSyncEnabled: boolean;

  @Column({ type: 'datetime', nullable: true, comment: 'Thời gian đồng bộ tiếp theo' })
  nextSyncTime?: Date;

  @Column({ type: 'int', default: 0, comment: 'Số lần đồng bộ thất bại' })
  syncFailureCount: number;

  @Column({ type: 'text', nullable: true, comment: 'Thông tin lỗi đồng bộ cuối cùng' })
  lastSyncError?: string;

  @CreateDateColumn({ comment: 'Thời gian tạo' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Thời gian cập nhật' })
  updatedAt: Date;

  // Quan hệ liên kết
  @ManyToOne(() => Order, order => order.logisticsTracking)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToMany(() => LogisticsTrace, trace => trace.logisticsTracking)
  traces: LogisticsTrace[];
}
