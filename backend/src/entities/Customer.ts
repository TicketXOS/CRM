import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from './Order';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_code', length: 50, nullable: true, comment: 'Mã khách hàng' })
  customerNo?: string;

  @Column({ length: 100, comment: 'Tên khách hàng' })
  name: string;

  @Column({ length: 20, nullable: true, comment: 'Số điện thoại' })
  phone?: string;

  @Column({ length: 100, nullable: true, comment: 'ID WeChat' })
  wechat?: string;

  @Column({ length: 50, nullable: true, comment: 'ID QQ' })
  qq?: string;

  @Column({ length: 100, nullable: true, comment: 'Email' })
  email?: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'unknown'],
    default: 'unknown',
    comment: 'Giới tính'
  })
  gender: 'male' | 'female' | 'unknown';

  @Column({ type: 'int', nullable: true, comment: 'Tuổi' })
  age?: number;

  @Column({ type: 'date', nullable: true, comment: 'Ngày sinh' })
  birthday?: Date;

  @Column({ name: 'id_card', length: 255, nullable: true, comment: 'Số CMND/CCCD' })
  idCard?: string;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true, comment: 'Chiều cao (cm)' })
  height?: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true, comment: 'Cân nặng (kg)' })
  weight?: number;

  @Column({ type: 'text', nullable: true, comment: 'Địa chỉ đầy đủ' })
  address?: string;

  @Column({ length: 50, nullable: true, comment: 'Tỉnh/Thành phố' })
  province?: string;

  @Column({ length: 50, nullable: true, comment: 'Thành phố/Quận' })
  city?: string;

  @Column({ length: 50, nullable: true, comment: 'Quận/Huyện' })
  district?: string;

  @Column({ length: 100, nullable: true, comment: 'Đường/Phố' })
  street?: string;

  @Column({ name: 'detail_address', length: 200, nullable: true, comment: 'Địa chỉ chi tiết' })
  detailAddress?: string;

  @Column({ name: 'overseas_address', length: 500, nullable: true, comment: 'Địa chỉ nước ngoài' })
  overseasAddress?: string;

  @Column({ length: 200, nullable: true, comment: 'Tên công ty' })
  company?: string;

  @Column({ length: 100, nullable: true, comment: 'Ngành nghề' })
  industry?: string;

  @Column({ length: 50, nullable: true, comment: 'Nguồn khách hàng' })
  source?: string;

  @Column({ length: 20, default: 'normal', comment: 'Cấp độ khách hàng' })
  level: string;

  @Column({ length: 20, default: 'active', comment: 'Trạng thái' })
  status: string;

  @Column({ name: 'follow_status', length: 20, nullable: true, comment: 'Trạng thái theo dõi' })
  followStatus?: string;

  @Column({ type: 'json', nullable: true, comment: 'Nhãn' })
  tags?: string[];

  @Column({ type: 'text', nullable: true, comment: 'Ghi chú' })
  remark?: string;

  @Column({ name: 'medical_history', type: 'text', nullable: true, comment: 'Tiền sử bệnh tật' })
  medicalHistory?: string;

  @Column({ name: 'improvement_goals', type: 'json', nullable: true, comment: 'Mục tiêu cải thiện' })
  improvementGoals?: string[];

  @Column({ name: 'other_goals', length: 200, nullable: true, comment: 'Mục tiêu cải thiện khác' })
  otherGoals?: string;

  @Column({ name: 'order_count', type: 'int', default: 0, comment: 'Số lượng đơn hàng' })
  orderCount: number;

  @Column({ name: 'return_count', type: 'int', default: 0, comment: 'Số lần trả hàng' })
  returnCount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Tổng số tiền đã chi' })
  totalAmount: number;

  @Column({ name: 'fan_acquisition_time', type: 'datetime', nullable: true, comment: 'Thời gian thu hút khách hàng' })
  fanAcquisitionTime?: Date;

  @Column({ name: 'last_order_time', type: 'timestamp', nullable: true, comment: 'Thời gian đặt hàng cuối' })
  lastOrderTime?: Date;

  @Column({ name: 'last_contact_time', type: 'timestamp', nullable: true, comment: 'Thời gian liên hệ cuối' })
  lastContactTime?: Date;

  @Column({ name: 'next_follow_time', type: 'timestamp', nullable: true, comment: 'Thời gian theo dõi tiếp theo' })
  nextFollowTime?: Date;

  @Column({ name: 'sales_person_id', length: 50, nullable: true, comment: 'ID nhân viên bán hàng' })
  salesPersonId?: string;

  @Column({ name: 'sales_person_name', length: 50, nullable: true, comment: 'Tên nhân viên bán hàng' })
  salesPersonName?: string;

  @Column({ name: 'created_by', length: 50, comment: 'ID người tạo' })
  createdBy: string;

  @Column({ name: 'created_by_name', length: 50, nullable: true, comment: 'Tên người tạo' })
  createdByName?: string;

  @CreateDateColumn({ name: 'created_at', comment: 'Thời gian tạo' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: 'Thời gian cập nhật' })
  updatedAt: Date;

  // Quan hệ liên kết
  @OneToMany(() => Order, order => order.customer)
  orders: Order[];
}
