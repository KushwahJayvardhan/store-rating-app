import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rating } from './rating.entity';
import { Store } from './store.entity';

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  NORMAL_USER = 'NORMAL_USER',
  STORE_OWNER = 'STORE_OWNER',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  @Index('IDX_USERS_NAME')
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  passwordHash: string;

  @Column({ type: 'varchar', length: 400, nullable: false })
  @Index('IDX_USERS_ADDRESS')
  address: string;

  @Index('IDX_USERS_ROLE')
  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.NORMAL_USER,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  @Index('IDX_USERS_CREATED_AT')
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;

  @OneToOne(() => Store, (store) => store.owner)
  store: Store | null;

  @OneToMany(() => Rating, (rating) => rating.user, { cascade: true })
  ratings: Rating[];
}
