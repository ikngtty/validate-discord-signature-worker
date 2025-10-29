/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Authorize.
		// HACK: This is too simple.
		// If the token is leaked and be regenerated, all applications that
		// use this service must change their settings.
		// Separete tokens for each application is better.
		const authToken = request.headers.get("x-auth-token");
		if (authToken !== env.AUTH_TOKEN) {
			return new Response("Unauthorized.", { status: 401 });
		}

		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
