import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm'
import { User } from './User'
import { Permission } from './Permission'

@Entity('roles')
export class Role {
  @PrimaryColumn('varchar', { length: 50 })
  id: string

  @Column({ unique: true, length: 50 })
  name: string

  @Column({ unique: true, length: 50 })
  code: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: 'active' })
  status: 'active' | 'inactive'

  @Column({ default: 0 })
  level: number

  @Column({ nullable: true, length: 20 })
  color: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Quyền hạn mà vai trò sở hữu (tạm thời bị chú thích, tránh truy vấn liên kết phức tạp gây lỗi)
  // @ManyToMany(() => Permission, permission => permission.roles)
  // @JoinTable({
  //   name: 'role_permissions',
  //   joinColumn: { name: 'roleId', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
  // })
  // permissions: Permission[]

  // Sử dụng trường JSON để lưu trữ quyền hạn (khớp với cấu trúc bảng cơ sở dữ liệu)
  @Column('json', { nullable: true })
  permissions: string[] | null

  // Người dùng sở hữu vai trò này (bị chú thích, vì entity User sử dụng chuỗi role thay vì liên kết)
  // @ManyToMany(() => User, user => user.roles)
  // users: User[]
}
