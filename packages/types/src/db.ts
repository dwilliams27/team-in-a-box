export type WithId<T> = T & { _id: string };

export const BOX_DB_NAME = 'BoxDB';

export const BOX_DB_INBOUND_EVENT_STREAM_COLLECTION = 'inbound_event_stream';
export const BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION = 'outbound_event_stream';
export const BOX_DB_BRAIN_EVENT_STREAM_COLLECTION = 'brain_event_stream';

export const BOX_DB_SLACK_DATA_COLLECTION = 'slack_data';

export const BOX_DB_PERSONA_COLLECTION = 'personas';

export const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ID_LENGTH = 16;
