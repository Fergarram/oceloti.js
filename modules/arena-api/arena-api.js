async function arena_sign_in(token) {
	if (!token) {
		console.error("Can't sign in without token.");
		return {
			status: "error",
			message: "Can't sign in without token."
		};
	}

	try {
		const user = await fetch_arena({
			endpoint: "/me",
			token
		});
		localStorage.setItem("ARENA_TOKEN", token);
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
}

async function fetch_arena({
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