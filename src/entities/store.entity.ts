import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rating } from './rating.entity';
import { User } from './user.entity';

@Entity({ name: 'stores' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_STORES_NAME')
  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Index('IDX_STORES_ADDRESS')
  @Column({ type: 'varchar', length: 400, nullable: false })
  address: string;

  @Index('IDX_STORES_OWNER_ID')
  @Column({ name: 'owner_id', type: 'uuid', nullable: false })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.stores, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Rating, (rating) => rating.store, { cascade: true })
  ratings: Rating[];
}
