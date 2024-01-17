import { DenonAVR } from "../src/denon";

const denon = new DenonAVR({
	host: '192.168.1.9'
});

async function main() {
	// denon.on('raw', data => {
	// 	console.log({ data: data.toString() });
	// });
	denon.on('mainZoneOn', () => {
		console.log('mainZoneOn');
	});
	denon.on('mainZoneOff', () => {
		console.log('mainZoneOff');
	});

	await denon.connect();
}

main().catch(console.error);