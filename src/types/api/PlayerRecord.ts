import type { Death } from "@/db/schema/death";
import type { PlayerRecord } from "@/db/schema/playerRecord";

export type ApiPlayerRecord = PlayerRecord & { deaths?: Death[] };
