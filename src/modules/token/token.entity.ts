import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('Token')
export class Token {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'AccessToken' })
  accessToken: string;

  @Column({ name: 'RefreshToken' })
  refreshToken: string;

  @Column({
    name: 'CreatedDatetime',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDatetime: Date;

  @Column({
    name: 'UpdatedDatetime',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedDatetime: Date;

  @Column({ name: 'DeletedDatetime', type: 'timestamp', nullable: true })
  deletedDatetime: Date | null;

  @Column({ name: 'ExpiresDatetime', type: 'timestamp', nullable: true })
  expiresDatetime: Date | null;

  @Column({ name: 'Version' })
  @VersionColumn()
  version: number;

  @ManyToOne(() => User, user => user.tokens)
  @JoinColumn({ name: 'UserID' })
  user: User;
}