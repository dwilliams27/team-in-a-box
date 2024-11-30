import { Repository } from "typeorm";

export async function updateJsonbFieldShallow(repository: Repository<any>, field: string, key: string, value: string, ids: number[]) {
  const set = { field: () => `${field} = jsonb_set(${field}, '{${key}}', '"${value}"'::jsonb)` };
  return repository
    .createQueryBuilder()
    .update()
    // Bad for now
    .set(set as any)
    .where("id IN (:...ids)", { ids })
    .execute();
}

const newEvents = await inboundEventsRepository
        .createQueryBuilder()
        .where("entity.pre_processing->'status' = :value", {
          value: EventStatus.PROCESSED
        })
        .andWhere("entity.processing->'other'->>'field' = :value", { 
          value: EventStatus.PENDING 
        })
        .getMany();

export async function getManyByJsonbFieldShallow(repository: Repository<any>, field: string, key: string, value: string) {
  return repository
    .createQueryBuilder()
    .where(`${field}->>'${key}' = :value`, { value })
    .getMany();
}