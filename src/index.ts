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

import { sign } from 'tweetnacl';

type Ok<T> = { ok: true, value: T };
type Err<T> = { ok: false, value: T };
type Result<TO, TE> = Ok<TO> | Err<TE>;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Authorize.
		// HACK: This is too simple.
		// If the token is leaked and be regenerated, all applications that
		// use this service must change their settings.
		// Separete tokens for each application is better.
		const authToken = request.headers.get('x-auth-token');
		if (authToken !== env.AUTH_TOKEN) {
			return new Response(
				'{"title":"Unauthorized","detail":"Auth token is missing or invalid."}',
				{ status: 401 },
			);
		}

		// Check the request.
		const body = await request.text();
		const publicKeyHex = requireHeader(request, 'X-Signature-PublicKey');
		if (!publicKeyHex.ok) {
			return publicKeyHex.value;
		}
		const signatureHex = requireHeader(request, 'X-Signature-Ed25519');
		if (!signatureHex.ok) {
			return signatureHex.value;
		}
		const timestamp = requireHeader(request, 'X-Signature-Timestamp');
		if (!timestamp.ok) {
			return timestamp.value;
		}
		const message = timestamp.value + body;

		console.log(message);
		console.log(signatureHex.value);
		console.log(publicKeyHex.value);

		// Verify.
		const isValid = sign.detached.verify(
			Buffer.from(message),
			Buffer.from(signatureHex.value, 'hex'),
			Buffer.from(publicKeyHex.value, 'hex'),
		);

		// Respond.
		// TODO: Define a response body type.
		if (!isValid) {
			return new Response('{"isValid":false}');
		}
		return new Response('{"isValid":true}');
	},
} satisfies ExportedHandler<Env>;

function requireHeader(request: Request, key: string): Result<string, Response> {
	const value = request.headers.get(key);
	if (value == null || value === '') {
		return {
			ok: false,
			value: new Response(
				`{"title":"Missing Header","detail":"The header '${key}' is required but missing."}`,
				{ status: 400 },
			),
		};
	}
	return {
		ok: true,
		value,
	};
}
