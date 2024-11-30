import { BoxPersonaDB } from "@box/types";
import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
export class EPersona implements BoxPersonaDB {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index('reference_idx', { unique: true })
  reference!: string;

  @Column('text')
  name!: string;
  
  @Column('text')
  system_prompt!: string;

  @Column('text')
  github_app_id!: string;

  @Column('text')
  github_client_id!: string;

  @Column('text')
  github_private_key!: string;

  @Column('text')
  slack_user_id!: string;

  @Column('jsonb', { nullable: true })
  filter!: Record<string, string> | null;
}
