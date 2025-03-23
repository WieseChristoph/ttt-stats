import type { NewRound } from "@/db/schema/round";
import type { ApiPlayerRecord } from "./PlayerRecord";

export type ApiRound = NewRound & { playerRecords?: ApiPlayerRecord[] };
