import { ID_ALPHABET, ID_LENGTH } from "@box/types";
import { customAlphabet } from "nanoid";

export function genUid() {
  return customAlphabet(ID_ALPHABET, ID_LENGTH)();
}
