import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { User } from './user.entity';

@Entity({ name: 'ratings' })
@Unique('UQ_RATINGS_USER_STORE', ['userId', 'storeId'])
@Check('CHK_RATING_VALUE', '"value" BETWEEN 1 AND 5')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'smallint', nullable: false })
  value!: number;

  @Index('IDX_RATINGS_USER_ID')
  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index('IDX_RATINGS_STORE_ID')
  @Column({ name: 'store_id', type: 'uuid', nullable: false })
  storeId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.ratings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Store, (store) => store.ratings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;
}
