import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { OAuthAccountInfo } from '../oauth-account-info/oauth-account-info.entity';
import { Token } from '../token/token.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'UserDisplayName', nullable: true })
  userDisplayName: string | null;

  @Column({ name: 'Title', nullable: true })
  title: string | null;

  @Column({ name: 'RankAlias', nullable: true })
  rankAlias: string | null;

  @Column({ name: 'Email', unique: true })
  email: string;

  @Column({ name: 'LoginName', unique: true, nullable: true })
  loginName: string | null;

  @Column({ name: 'PasswordHash', nullable: true })
  passwordHash: string | null;

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

  @Column({ name: 'Version', default: 1 })
  @VersionColumn()
  version: number;

  @OneToMany(() => OAuthAccountInfo, oauthAccountInfo => oauthAccountInfo.user)
  oauthAccountInfo: OAuthAccountInfo[];

  @OneToMany(() => Token, token => token.user)
  tokens: Token[];
}