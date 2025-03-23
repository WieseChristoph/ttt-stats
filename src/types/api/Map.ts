import type { Map as MapType } from "@/db/schema/map";
import type { ApiRound } from "./Round";

export type ApiMap = MapType & { rounds?: ApiRound[] };
