register_oceloti_module({
	name: "arena-api",
	deps: [],
	init() {
		const exports = {
			user: null,
			get_user() {
				return exports.user;
			},
			async sign_out() {
				localStorage.removeItem("ARENA_USER");
				localStorage.removeItem("ARENA_TOKEN");
				document.cookie = "arenaAuthToken=; path=/; Secure; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0";
				exports.user = null;
			},
			async sign_in(token) {
				if (!token) {
					console.error("Can't sign in without token.");
					return {
						status: "error",
						message: "Can't sign in without token."
					};
				}

				try {
					const user = await exports.query({
						endpoint: "/me",
						token
					});
					exports.user = user;
					document.cookie = `arenaAuthToken=${token}; path=/; Secure; max-age=2628000`;
					localStorage.setItem("ARENA_TOKEN", token);
					localStorage.setItem("ARENA_USER", JSON.stringify(user));

					return {
						status: "success",
						message: `Hello ${user.full_name}.`,
						user
					}
				} catch(e) {
					console.error("Failed to sign in with token:", token);
					return {
						status: "error",
						message: "Bad token. Use a different token or generate again."
					};
				}
			},
			async query({
				endpoint,
				token,
				params = "",
				body = {}
			}) {
				const local_token = localStorage.getItem("ARENA_TOKEN");

				const BASE_URL = 'https://api.are.na/v2';

				const headers = { "Content-Type": "application/json" }

				if (token || local_token) {
					headers["Authorization"] = `Bearer ${token || local_token}`
				}

				const response = await fetch(`${BASE_URL}${endpoint}${params}`, {
					method: "GET",
					headers
				});

				if (!response.ok)
					throw new Error('Network response was not ok');

				return response.json();
			}
		};

		const ls_user_data = localStorage.getItem("ARENA_USER");
		const ls_token = localStorage.getItem("ARENA_TOKEN");

		if (ls_user_data !== null && ls_token !== null) {
			try {
				exports.user = JSON.parse(ls_user_data);
			} catch(e) {
				console.warn("localStorage arena user data is in bad shape", ls_user_data);
				localStorage.removeItem("ARENA_USER");
				localStorage.removeItem("ARENA_TOKEN");
			}
		}

		return exports;
	}
});