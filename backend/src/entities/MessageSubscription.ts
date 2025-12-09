import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from './Department';

// Liệt kê loại tin nhắn
export enum MessageType {
  ORDER_CREATED = 'order_created',
  ORDER_SIGNED = 'order_signed',
  ORDER_AUDIT_REJECTED = 'order_audit_rejected',
  ORDER_AUDIT_APPROVED = 'order_audit_approved',
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}

// Liệt kê phương thức thông báo
export enum NotificationMethod {
  DINGTALK = 'dingtalk',
  WECHAT_WORK = 'wechat_work',
  WECHAT_OFFICIAL = 'wechat_official',
  EMAIL = 'email',
  SYSTEM_MESSAGE = 'system_message',
  ANNOUNCEMENT = 'announcement'
}

@Entity('message_subscriptions')
export class MessageSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Loại tin nhắn'
  })
  messageType: MessageType;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Tên tin nhắn'
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Mô tả tin nhắn'
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Phân loại tin nhắn'
  })
  category: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Có bật toàn cục không'
  })
  isGlobalEnabled: boolean;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Phương thức thông báo toàn cục'
  })
  globalNotificationMethods: NotificationMethod[];

  @CreateDateColumn({
    comment: 'Thời gian tạo'
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Thời gian cập nhật'
  })
  updatedAt: Date;
}

@Entity('department_subscription_configs')
export class DepartmentSubscriptionConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Loại tin nhắn'
  })
  messageType: MessageType;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Có bật không'
  })
  isEnabled: boolean;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Phương thức thông báo'
  })
  notificationMethods: NotificationMethod[];

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn({
    comment: 'Thời gian tạo'
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Thời gian cập nhật'
  })
  updatedAt: Date;
}
