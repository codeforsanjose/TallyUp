import { Entry } from "./app/main";
import { boilerplate } from "./lib/boilerplate";

export const build = (): string => {
  return boilerplate(Entry);
}