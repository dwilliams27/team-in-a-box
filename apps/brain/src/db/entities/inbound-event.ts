import { SlackEvent, SlackDataDB, EventProcessingMetadata, InboundEventDB, EventType } from "@box/types";
import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
export class EInboundEvent implements InboundEventDB {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index('reference_idx', { unique: true })
  reference!: string;

  @Column('jsonb')
  processing!: EventProcessingMetadata;

  @Column('jsonb')
  pre_processing!: EventProcessingMetadata;

  @Column('string')
  type!: EventType;

  @Column('text', { array: true })
  for_personas!: string[];

  @Column('jsonb')
  slack?: SlackEvent;
}
