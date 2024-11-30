import { SlackEvent, SlackDataDB } from "@box/types";
import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
export class ESlackData implements SlackDataDB {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index('reference_idx', { unique: true })
  reference!: string;

  @Column('jsonb')
  event!: SlackEvent;

  @Column()
  embedding!: string;
}
