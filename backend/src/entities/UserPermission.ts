import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './User'
import { Permission } from './Permission'

@Entity('user_permissions')
export class UserPermission {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @Column()
  permissionId: number

  @Column({ nullable: true })
  grantedBy: number

  @Column({ type: 'text', nullable: true })
  reason: string

  @CreateDateColumn()
  grantedAt: Date

  // Liên kết người dùng (đã loại bỏ liên kết ngược, vì entity User không có trường personalPermissions)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  // Liên kết quyền hạn
  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permissionId' })
  permission: Permission

  // Người cấp quyền
  @ManyToOne(() => User)
  @JoinColumn({ name: 'grantedBy' })
  grantor: User
}
