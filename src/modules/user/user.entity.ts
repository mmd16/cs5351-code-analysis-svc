import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ nullable: true })
  @Index()
  UserDisplayName: string;

  @Column({ nullable: true })
  Title: string;

  @Column({ nullable: true })
  RankAlias: string;

  @Column()
  @Index()
  Email: string;

  @Column({ nullable: true })
  LoginName: string;

  @Column({ nullable: true })
  Password: string;

  @Column({ nullable: true })
  GithubId: string;

  @Column({ nullable: true })
  GoogleId: string;

  @Column({ default: 1 })
  Version: number;
}
