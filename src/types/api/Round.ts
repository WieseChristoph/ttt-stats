import type { Round } from "@/db/schema/round";
import type { ApiPlayerRecord } from "./PlayerRecord";

export type ApiRound = Round & { playerRecords?: ApiPlayerRecord[] };
