import { Team } from "@/enums/Team";

export function getTeamColor(team: Team): string {
	switch (team) {
		case Team.Innocents:
			return "#43CA1F";
		case Team.Traitors:
			return "#F60C0C";
		case Team.Jackals:
			return "#63C0D1";
		case Team.Lovers:
			return "#F50C94";
		case Team.Infecteds:
			return "#733D51";
		case Team.Jesters:
			return "#E65EA2";
		case Team.Dunces:
			return "#665E57";
		case Team.Nones:
			return "#7C6ED0";
	}
}
