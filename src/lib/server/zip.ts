/**
 * A minimal ZIP writer (store or deflate, no dependencies).
 *
 * Used to package `agent-kit/` for the site's download button. The site
 * is a folder of prerendered files with no server, so the archive has to
 * be built at build time rather than assembled on request.
 */

import { deflateRawSync } from 'node:zlib';

export interface ZipEntry {
	/** Forward-slash path stored inside the archive. */
	path: string;
	data: Uint8Array;
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const VERSION = 20;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
}

export function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS date/time fields, the timestamp format the ZIP spec requires. */
function dosDateTime(when: Date): { time: number; date: number } {
	const time = (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1);
	const date =
		(Math.max(0, when.getFullYear() - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate();
	return { time, date };
}

/** Builds a ZIP archive from `entries`. Every entry is stored or deflated, whichever is smaller. */
export function createZip(entries: ZipEntry[], when: Date = new Date()): Buffer {
	const { time, date } = dosDateTime(when);
	const localParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;

	for (const entry of entries) {
		const nameBytes = Buffer.from(entry.path, 'utf8');
		const data = Buffer.from(entry.data);
		const deflated = deflateRawSync(data);
		const useStore = deflated.length >= data.length;
		const method = useStore ? METHOD_STORE : METHOD_DEFLATE;
		const payload = useStore ? data : deflated;
		const crc = crc32(data);

		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
		localHeader.writeUInt16LE(VERSION, 4);
		localHeader.writeUInt16LE(0, 6); // flags
		localHeader.writeUInt16LE(method, 8);
		localHeader.writeUInt16LE(time, 10);
		localHeader.writeUInt16LE(date, 12);
		localHeader.writeUInt32LE(crc, 14);
		localHeader.writeUInt32LE(payload.length, 18);
		localHeader.writeUInt32LE(data.length, 22);
		localHeader.writeUInt16LE(nameBytes.length, 26);
		localHeader.writeUInt16LE(0, 28); // extra field length
		localParts.push(localHeader, nameBytes, payload);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
		centralHeader.writeUInt16LE(VERSION, 4); // version made by
		centralHeader.writeUInt16LE(VERSION, 6); // version needed
		centralHeader.writeUInt16LE(0, 8); // flags
		centralHeader.writeUInt16LE(method, 10);
		centralHeader.writeUInt16LE(time, 12);
		centralHeader.writeUInt16LE(date, 14);
		centralHeader.writeUInt32LE(crc, 16);
		centralHeader.writeUInt32LE(payload.length, 20);
		centralHeader.writeUInt32LE(data.length, 24);
		centralHeader.writeUInt16LE(nameBytes.length, 28);
		centralHeader.writeUInt16LE(0, 30); // extra field length
		centralHeader.writeUInt16LE(0, 32); // comment length
		centralHeader.writeUInt16LE(0, 34); // disk number start
		centralHeader.writeUInt16LE(0, 36); // internal attributes
		centralHeader.writeUInt32LE(0, 38); // external attributes
		centralHeader.writeUInt32LE(offset, 42);
		centralParts.push(centralHeader, nameBytes);

		offset += localHeader.length + nameBytes.length + payload.length;
	}

	const centralDirectory = Buffer.concat(centralParts);

	const end = Buffer.alloc(22);
	end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
	end.writeUInt16LE(0, 4); // disk number
	end.writeUInt16LE(0, 6); // disk where central directory starts
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(centralDirectory.length, 12);
	end.writeUInt32LE(offset, 16);
	end.writeUInt16LE(0, 20); // comment length

	return Buffer.concat([...localParts, centralDirectory, end]);
}
