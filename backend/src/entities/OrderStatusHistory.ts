import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, comment: 'ID đơn hàng' })
  orderId: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Trạng thái'
  })
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

  @Column({ type: 'text', nullable: true, comment: 'Ghi chú thay đổi trạng thái' })
  notes?: string;

  @Column({ type: 'int', nullable: true, comment: 'ID người thực hiện' })
  operatorId?: number;

  @Column({ length: 50, nullable: true, comment: 'Tên người thực hiện' })
  operatorName?: string;

  @CreateDateColumn({ comment: 'Thời gian tạo' })
  createdAt: Date;

  // Quan hệ liên kết
  @ManyToOne(() => Order, order => order.statusHistory)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
