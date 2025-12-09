import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Customer } from './Customer';
import { OrderItem } from './OrderItem';
import { OrderStatusHistory } from './OrderStatusHistory';
import { LogisticsTracking } from './LogisticsTracking';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', length: 50, unique: true, comment: 'Số đơn hàng' })
  orderNumber: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 50, comment: 'ID khách hàng' })
  customerId: string;

  @Column({ name: 'customer_name', length: 100, nullable: true, comment: 'Tên khách hàng' })
  customerName?: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true, comment: 'Số điện thoại khách hàng' })
  customerPhone?: string;

  @Column({ name: 'service_wechat', length: 100, nullable: true, comment: 'WeChat ID dịch vụ khách hàng' })
  serviceWechat?: string;

  @Column({ name: 'order_source', length: 50, nullable: true, comment: 'Nguồn đơn hàng' })
  orderSource?: string;

  @Column({ type: 'json', nullable: true, comment: 'Danh sách sản phẩm' })
  products?: unknown[];

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    comment: 'Trạng thái đơn hàng'
  })
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, comment: 'Tổng số tiền đơn hàng' })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Số tiền giảm giá' })
  discountAmount: number;

  @Column({ name: 'final_amount', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Số tiền thực tế thanh toán' })
  finalAmount: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Số tiền đặt cọc' })
  depositAmount: number;

  @Column({ name: 'deposit_screenshots', type: 'json', nullable: true, comment: 'Ảnh chụp đặt cọc' })
  depositScreenshots?: string[];

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 50,
    default: 'unpaid',
    comment: 'Trạng thái thanh toán'
  })
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Phương thức thanh toán'
  })
  paymentMethod?: 'cash' | 'alipay' | 'wechat' | 'bank_transfer' | 'credit_card' | 'other';

  @Column({ name: 'payment_time', type: 'datetime', nullable: true, comment: 'Thời gian thanh toán' })
  paymentTime?: Date;

  @Column({ name: 'shipping_name', length: 100, nullable: true, comment: 'Tên người nhận hàng' })
  shippingName?: string;

  @Column({ name: 'shipping_phone', length: 20, nullable: true, comment: 'Số điện thoại nhận hàng' })
  shippingPhone?: string;

  @Column({ name: 'shipping_address', type: 'text', nullable: true, comment: 'Địa chỉ nhận hàng' })
  shippingAddress?: string;

  @Column({ name: 'express_company', length: 50, nullable: true, comment: 'Công ty vận chuyển' })
  expressCompany?: string;

  @Column({ name: 'tracking_number', length: 100, nullable: true, comment: 'Mã vận đơn' })
  trackingNumber?: string;

  @Column({ name: 'shipped_at', type: 'datetime', nullable: true, comment: 'Thời gian giao hàng' })
  shippedAt?: Date;

  @Column({ name: 'delivered_at', type: 'datetime', nullable: true, comment: 'Thời gian nhận hàng' })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true, comment: 'Thời gian hủy đơn hàng' })
  cancelledAt?: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true, comment: 'Lý do hủy đơn hàng' })
  cancelReason?: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Số tiền hoàn tiền' })
  refundAmount?: number;

  @Column({ name: 'refund_reason', type: 'text', nullable: true, comment: 'Lý do hoàn tiền' })
  refundReason?: string;

  @Column({ name: 'refund_time', type: 'datetime', nullable: true, comment: 'Thời gian hoàn tiền' })
  refundTime?: Date;

  @Column({ name: 'invoice_type', length: 50, nullable: true, comment: 'Loại hóa đơn' })
  invoiceType?: string;

  @Column({ name: 'invoice_title', length: 200, nullable: true, comment: 'Tên hóa đơn' })
  invoiceTitle?: string;

  @Column({ name: 'invoice_number', length: 100, nullable: true, comment: 'Mã hóa đơn' })
  invoiceNumber?: string;

  @Column({ name: 'mark_type', length: 20, default: 'normal', comment: 'Loại đánh dấu đơn hàng' })
  markType?: string;

  @Column({ name: 'audit_status', length: 20, default: 'pending', comment: 'Trạng thái phê duyệt' })
  auditStatus?: string;

  @Column({ name: 'audit_transfer_time', type: 'datetime', nullable: true, comment: 'Thời gian chuyển giao phê duyệt' })
  auditTransferTime?: Date;

  @Column({ name: 'is_audit_transferred', type: 'boolean', default: false, comment: 'Đã chuyển giao đến phê duyệt chưa' })
  isAuditTransferred?: boolean;

  @Column({ name: 'custom_fields', type: 'json', nullable: true, comment: 'Trường tùy chỉnh' })
  customFields?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true, comment: 'Ghi chú đơn hàng' })
  remark?: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50, nullable: true, comment: 'ID người thực hiện' })
  operatorId?: string;

  @Column({ name: 'operator_name', length: 50, nullable: true, comment: 'Tên người thực hiện' })
  operatorName?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true, comment: 'ID người tạo' })
  createdBy?: string;

  @Column({ name: 'created_by_name', length: 50, nullable: true, comment: 'Tên người tạo' })
  createdByName?: string;

  @Column({ name: 'created_at', type: 'datetime', nullable: true, comment: 'Thời gian tạo' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true, comment: 'Thời gian cập nhật' })
  updatedAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }

  // Quan hệ liên kết
  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems: OrderItem[];

  @OneToMany(() => OrderStatusHistory, history => history.order)
  statusHistory: OrderStatusHistory[];

  @OneToMany(() => LogisticsTracking, tracking => tracking.order)
  logisticsTracking: LogisticsTracking[];
}
