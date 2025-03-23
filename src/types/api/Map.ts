import type { NewMap } from "@/db/schema/map";
import type { ApiRound } from "./Round";

export type ApiMap = NewMap & { rounds?: ApiRound[] };
