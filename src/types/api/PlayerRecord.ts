import type { NewDeath } from "@/db/schema/death";
import type { NewPlayerRecord } from "@/db/schema/playerRecord";

export type ApiPlayerRecord = NewPlayerRecord & { deaths?: NewDeath[] };
