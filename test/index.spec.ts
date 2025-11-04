import { SELF } from 'cloudflare:test';
import { sign } from 'tweetnacl';
import { describe, it, expect } from 'vitest';

const SEED = Buffer.from('SeedForTest234567890123456789012');

const RIGHT_AUTH_TOKEN = 'ThisFakeTokenIsDefinedInDotEnvTest';
const WRONG_AUTH_TOKEN = 'WrongToken';

describe('Validate Discord Signature Worker', () => {
	it('verifies a valid signature', async () => {
		const body = 'text from discord';
		const timestamp = '12345';
		const message = timestamp + body;
		const messageBytes = Buffer.from(message);

		const keyPair = sign.keyPair.fromSeed(SEED);
		const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
		const signatureBytes = sign.detached(messageBytes, keyPair.secretKey);
		const signatureHex = Buffer.from(signatureBytes).toString('hex');

		const response = await SELF.fetch('https://example.com', {
			method: 'POST',
			headers: {
				'x-auth-token': RIGHT_AUTH_TOKEN,
				'X-Signature-PublicKey': publicKeyHex,
				'X-Signature-Ed25519': signatureHex,
				'X-Signature-Timestamp': timestamp,
			},
			body,
		});

		expect(response.status).toBe(200);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('isValid', true);
	});

	it('verifies a invalid signature', async () => {
		const body = 'text from discord';
		const timestamp = '12345';
		const message = timestamp + body + 'get wrong';
		const messageBytes = Buffer.from(message);

		const keyPair = sign.keyPair.fromSeed(SEED);
		const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
		const signatureBytes = sign.detached(messageBytes, keyPair.secretKey);
		const signatureHex = Buffer.from(signatureBytes).toString('hex');

		const response = await SELF.fetch('https://example.com', {
			method: 'POST',
			headers: {
				'x-auth-token': RIGHT_AUTH_TOKEN,
				'X-Signature-PublicKey': publicKeyHex,
				'X-Signature-Ed25519': signatureHex,
				'X-Signature-Timestamp': timestamp,
			},
			body,
		});

		expect(response.status).toBe(200);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('isValid', false);
	});

	it('refuses without an auth token', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {},
		});
		expect(response.status).toBe(401);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('title', 'Unauthorized');
		expect(respBody).toHaveProperty('detail', 'Auth token is missing or invalid.');
	});

	it('refuses without a correct auth token', async () => {
		const response = await SELF.fetch('https://example.com', {
			headers: {
				'x-auth-token': WRONG_AUTH_TOKEN,
			},
		});
		expect(response.status).toBe(401);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('title', 'Unauthorized');
		expect(respBody).toHaveProperty('detail', 'Auth token is missing or invalid.');
	});

	it('refuses without a header "X-Signature-PublicKey"', async () => {
		const response = await SELF.fetch('https://example.com', {
			method: 'POST',
			headers: {
				'x-auth-token': RIGHT_AUTH_TOKEN,
				// 'X-Signature-PublicKey': 'abc',
				'X-Signature-Ed25519': 'abc',
				'X-Signature-Timestamp': 'abc',
			},
			body: 'abc',
		});

		expect(response.status).toBe(400);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('title', 'Missing Header');
		expect(respBody).toHaveProperty('detail', "The header 'X-Signature-PublicKey' is required but missing.");
	});

	it('refuses without a header "X-Signature-Ed25519"', async () => {
		const response = await SELF.fetch('https://example.com', {
			method: 'POST',
			headers: {
				'x-auth-token': RIGHT_AUTH_TOKEN,
				'X-Signature-PublicKey': 'abc',
				// 'X-Signature-Ed25519': 'abc',
				'X-Signature-Timestamp': 'abc',
			},
			body: 'abc',
		});

		expect(response.status).toBe(400);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('title', 'Missing Header');
		expect(respBody).toHaveProperty('detail', "The header 'X-Signature-Ed25519' is required but missing.");
	});

	it('refuses without a header "X-Signature-Timestamp"', async () => {
		const response = await SELF.fetch('https://example.com', {
			method: 'POST',
			headers: {
				'x-auth-token': RIGHT_AUTH_TOKEN,
				'X-Signature-PublicKey': 'abc',
				'X-Signature-Ed25519': 'abc',
				// 'X-Signature-Timestamp': 'abc',
			},
			body: 'abc',
		});

		expect(response.status).toBe(400);
		const respBody = await response.json();
		expect(respBody).toHaveProperty('title', 'Missing Header');
		expect(respBody).toHaveProperty('detail', "The header 'X-Signature-Timestamp' is required but missing.");
	});
});
