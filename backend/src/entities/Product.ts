import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { ProductCategory } from './ProductCategory'

@Entity('products')
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 50, comment: 'ID sản phẩm' })
  id: string

  @Column({ type: 'varchar', length: 50, unique: true, comment: 'Mã sản phẩm' })
  code: string

  @Column({ type: 'varchar', length: 200, comment: 'Tên sản phẩm' })
  name: string

  @Column({ name: 'category_id', type: 'varchar', length: 50, nullable: true, comment: 'ID phân loại' })
  categoryId?: string

  @Column({ name: 'category_name', type: 'varchar', length: 100, nullable: true, comment: 'Tên phân loại' })
  categoryName?: string

  @Column({ type: 'text', nullable: true, comment: 'Mô tả sản phẩm' })
  description?: string

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Giá bán' })
  price: number

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Giá vốn' })
  costPrice?: number

  @Column({ type: 'int', default: 0, comment: 'Số lượng tồn kho' })
  stock: number

  @Column({ name: 'min_stock', type: 'int', default: 0, comment: 'Tồn kho tối thiểu' })
  minStock: number

  @Column({ type: 'varchar', length: 20, default: 'cái', comment: 'Đơn vị' })
  unit: string

  @Column({ type: 'json', nullable: true, comment: 'Thông số kỹ thuật' })
  specifications?: Record<string, any>

  @Column({ type: 'json', nullable: true, comment: 'Hình ảnh sản phẩm' })
  images?: string[]

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
    comment: 'Trạng thái'
  })
  status: 'active' | 'inactive'

  @Column({ name: 'created_by', type: 'varchar', length: 50, comment: 'Người tạo' })
  createdBy: string

  @CreateDateColumn({ name: 'created_at', comment: 'Thời gian tạo' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', comment: 'Thời gian cập nhật' })
  updatedAt: Date

  // Quan hệ liên kết
  @ManyToOne(() => ProductCategory, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category?: ProductCategory
}
