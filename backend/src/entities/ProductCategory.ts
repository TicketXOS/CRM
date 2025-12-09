import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Product } from './Product'

@Entity('product_categories')
export class ProductCategory {
  @PrimaryColumn({ type: 'varchar', length: 50, comment: 'ID phân loại' })
  id: string

  @Column({ length: 100, comment: 'Tên phân loại' })
  name: string

  @Column({ name: 'parent_id', type: 'varchar', length: 50, nullable: true, comment: 'ID phân loại cấp trên' })
  parentId?: string

  @Column({ type: 'text', nullable: true, comment: 'Mô tả phân loại' })
  description?: string

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: 'Thứ tự sắp xếp' })
  sortOrder: number

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
    comment: 'Trạng thái'
  })
  status: 'active' | 'inactive'

  @CreateDateColumn({ name: 'created_at', comment: 'Thời gian tạo' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', comment: 'Thời gian cập nhật' })
  updatedAt: Date

  // Quan hệ liên kết
  @OneToMany(() => Product, product => product.category)
  products: Product[]
}
