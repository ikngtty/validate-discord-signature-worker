import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('Hello World worker', () => {
	it('responds with Hello World!', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {
				'x-auth-token': 'ThisFakeTokenIsDefinedInDotEnvTest',
			},
		});
		expect(response.status).toBe(200);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('refuses a wrong token', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {
				'x-auth-token': 'WrongToken',
			},
		});
		expect(response.status).toBe(401);
		expect(await response.text()).toMatchInlineSnapshot(`"Unauthorized."`);
	});
});
