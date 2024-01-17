import Telnet, { ConnectOptions } from 'telnet-client';
var connection = new Telnet()


async function main() {
	let connection = new Telnet()

	try {
		await connection.connect({
			host: '192.168.1.9',
			port: 23,
			sendTimeout: 1200,
			execTimeout: 1200,
			negotiationMandatory: false,
			shellPrompt: '',
			irs: '\r',
			ors: '\r',
		})
	} catch (error) {
		// handle the throw (timeout)
		console.error(error);
	}

	connection.on('data', (data: Buffer) => {
		console.log({ data: data.toString() });
	})

	connection.on('connect', () => {
		console.log('connect...');
	})

	connection.on('ready', () => {
		console.log('ready...');
	})
	
	connection.on('timeout', () => {
		console.log('timeout...');
	})
	
	connection.on('close', () => {
		console.log('close...');
	})

	//let res = await connection.exec(cmd)
	//console.log('async result:', res)
}

main();