export type SteamResponse = {
	response: {
		players: SteamUser[];
	};
};

export type SteamUser = {
	steamid: string;
	communityvisibilitystate: number;
	profilestate: number;
	personaname: string;
	commentpermission: number;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	lastlogoff: number;
	personastate: number;
	realname: string;
	primaryclanid: number;
	timecreated: number;
	personastateflags: number;
	loccountrycode: string;
	locstatecode: string;
};
