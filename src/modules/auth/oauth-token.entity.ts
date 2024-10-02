import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';


@Entity()
export class OAuthToken {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  AccessToken: string;

  @Column({ nullable: true })
  RefreshToken: string;

  @Column()
  ExpireDatetime: Date;

  @Column()
  Provider: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'UserID' })
  User: User;

  @Column({ default: 1 })
  Version: number;
}