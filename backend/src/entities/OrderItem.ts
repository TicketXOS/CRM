import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, comment: 'ID đơn hàng' })
  orderId: string;

  @Column({ type: 'varchar', length: 50, comment: 'ID sản phẩm' })
  productId: string;

  @Column({ length: 100, comment: 'Tên sản phẩm (ảnh chụp nhanh)' })
  productName: string;

  @Column({ length: 50, nullable: true, comment: 'SKU sản phẩm (ảnh chụp nhanh)' })
  productSku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Đơn giá (ảnh chụp nhanh)' })
  unitPrice: number;

  @Column({ type: 'int', comment: 'Số lượng' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Tổng tiền' })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Tiền khuyến mãi' })
  discountAmount: number;

  @Column({ type: 'text', nullable: true, comment: 'Ghi chú' })
  notes?: string;

  // Quan hệ liên kết
  @ManyToOne(() => Order, order => order.orderItems)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
