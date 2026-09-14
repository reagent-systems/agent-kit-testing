import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createZip, crc32, type ZipEntry } from './zip';

/** Reads back every local file entry, independent of createZip's own logic. */
function readZipEntries(zip: Buffer): { path: string; data: Buffer; crc: number }[] {
	const entries: { path: string; data: Buffer; crc: number }[] = [];
	let offset = 0;

	while (zip.readUInt32LE(offset) === 0x04034b50) {
		const method = zip.readUInt16LE(offset + 8);
		const crc = zip.readUInt32LE(offset + 14);
		const compressedSize = zip.readUInt32LE(offset + 18);
		const nameLength = zip.readUInt16LE(offset + 26);
		const extraLength = zip.readUInt16LE(offset + 28);

		const nameStart = offset + 30;
		const dataStart = nameStart + nameLength + extraLength;
		const path = zip.subarray(nameStart, nameStart + nameLength).toString('utf8');
		const compressed = zip.subarray(dataStart, dataStart + compressedSize);
		const data = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed);

		entries.push({ path, data, crc });
		offset = dataStart + compressedSize;
	}

	return entries;
}

describe('createZip', () => {
	it('round-trips stored and deflated entries', () => {
		const entries: ZipEntry[] = [
			{ path: 'agent-kit/ROUTING.md', data: Buffer.from('# ROUTING.md\n'.repeat(50)) },
			{ path: 'agent-kit/docs/STYLE.md', data: Buffer.from('short') }
		];

		const zip = createZip(entries);
		const readBack = readZipEntries(zip);

		expect(readBack.map((entry) => entry.path)).toEqual(entries.map((entry) => entry.path));
		for (const [index, entry] of readBack.entries()) {
			expect(entry.data.toString('utf8')).toBe(Buffer.from(entries[index].data).toString('utf8'));
			expect(entry.crc).toBe(crc32(entries[index].data));
		}
	});

	it('ends with a valid end-of-central-directory record', () => {
		const zip = createZip([{ path: 'a.txt', data: Buffer.from('a') }]);
		const end = zip.subarray(zip.length - 22);

		expect(end.readUInt32LE(0)).toBe(0x06054b50);
		expect(end.readUInt16LE(8)).toBe(1); // one central directory record
		expect(end.readUInt16LE(10)).toBe(1);
	});

	it('produces an empty but well-formed archive for no entries', () => {
		const zip = createZip([]);
		expect(zip.length).toBe(22);
		expect(zip.readUInt32LE(0)).toBe(0x06054b50);
	});
});
