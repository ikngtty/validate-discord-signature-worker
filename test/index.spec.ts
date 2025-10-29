import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Hello World worker', () => {
	it('responds with Hello World! (unit style)', async () => {
		const request = new IncomingRequest('http://example.com', {
			headers: {
				"x-auth-token": "ThisFakeTokenIsDefinedInDotEnvTest",
			},
		});
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {
				"x-auth-token": "ThisFakeTokenIsDefinedInDotEnvTest",
			},
		});
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('refuse a wrong token (unit style)', async () => {
		const request = new IncomingRequest('http://example.com', {
			headers: {
				"x-auth-token": "WrongToken",
			},
		});
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(response.status).toEqual(401);
		expect(await response.text()).toMatchInlineSnapshot(`"Unauthorized."`);
	});

	it('refuse a wrong token (integration style)', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {
				"x-auth-token": "WrongToken",
			},
		});
		expect(response.status).toEqual(401);
		expect(await response.text()).toMatchInlineSnapshot(`"Unauthorized."`);
	});
});
