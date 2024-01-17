import { EventEmitter } from 'events';
import TelnetClient, { ConnectOptions } from 'telnet-client';

export declare interface DenonAVR {
	on(event: 'raw', listener: (data: Buffer) => void): this;
	on(event: 'connected', listener: () => void): this;
	on(event: 'disconnected', listener: () => void): this;
	on(event: 'powerOn', listener: () => void): this;
	on(event: 'powerStandby', listener: () => void): this;
	on(event: 'mainZoneOn', listener: () => void): this;
	on(event: 'mainZoneOff', listener: () => void): this;
}

export interface DenonConfig {
	host: string;
	port?: number;
}

/**
 * Create the controller class with the provided connection
 */
export class DenonAVR extends EventEmitter {
	constructor(config: DenonConfig) {
		super();
		this.config = {
			port: 23,
			sendTimeout: 1200,
			execTimeout: 1200,
			negotiationMandatory: false,
			shellPrompt: '',
			irs: '\r',
			ors: '\r',
			...config,
		};
		this.connection = new TelnetClient();
	}

	private config: ConnectOptions;
	public connection: TelnetClient;

	/**
	 * Connect to the AVR via the defined transport
	 */
	public async connect() {
		// setup the event emitters
		this.connection.on('data', (data: Buffer) => {
			this.parseData(data);
		});

		this.connection.on('ready', () => {
			this.emit('connected');
		});
		this.connection.on('close', () => {
			this.emit('disconnected');
		});
		await this.connection.connect(this.config);
	}

	public async disconnect() {
		await this.connection.destroy();
	}

	/**
	 * Send a command when we expect a single response
	 *
	 * @param   string    command   Command to be sent, eg MV?
	 * @param   string    prefix    What the expected response will be prefixed with, eg MV for main volume
	 */
	public async send(cmd: string, prefix: string) {
		const response = await this.connection.exec(cmd);
		await this.parseResponse([response], prefix);
	}

	/**
	 * Parse a event received from the AVR not from sending a command
	 *
	 * @param   buffer    data
	 */
	public parseData(data: Buffer) {
		const value = data.toString();
		this.emit('raw', data);

		if (value.startsWith('PWON')) {
			this.emit('powerOn');
		} else if (value.startsWith('PWSTANDBY')) {
			this.emit('powerStandby');
		} else if (value.startsWith('ZMON')) {
			this.emit('mainZoneOn');
		} else if (value.startsWith('ZMOFF')) {
			this.emit('mainZoneOff');
		}
	}

	/**
	 * Parse the response when sending a command
	 *
	 * @param   string        data      Data returned from the transport
	 * @param   string|RegExp prefix    What the expected response will be prefixed with, eg MV for main volume
	 */
	public parseResponse(data: string[], prefix: string | RegExp): Promise<string> {
		// TODO: The way this worked before there could be many callbacks
		// Check to see if that is necessary
		data.forEach(item => {
			if (prefix instanceof RegExp) {
				if (item.match(prefix)) {
					return item;
				}
			} else {
				if (item.substring(0, prefix.length) === prefix) {
					return item.substring(prefix.length);
				}
			}
		});

		throw new Error('Failed to parse response');
	}

	// public setPowerState(state: boolean) {

	// }
}


// /**
//  * Set the power state to either true/false
//  *
//  * @param   bool      state
//  * @param   function  callback
//  */
// denon.prototype.setPowerState = function (state, callback) {
// 	var cmd = 'PWSTANDBY';

// 	if (state) {
// 		cmd = 'PWON';
// 	}

// 	this.send(cmd, 'PW', callback, 'Unable to change power state, is the AVR already set to this state?');
// }

// /**
//  * Get the current power state
//  *
//  * @param   function  callback
//  */
// denon.prototype.getPowerState = function (callback) {
// 	this.send('PW?', 'PW', callback, 'Unable to get current power state');
// }

// /**
//  * Increase the volume by 0.5dB
//  *
//  * @param   function  callback
//  */
// denon.prototype.setVolumeUp = function (callback) {
// 	this.send('MVUP', new RegExp('[A-Z]{2}[0-9]{2,3}$'), function (err, volume) {
// 		if (err) {
// 			callback(err);
// 			return;
// 		}

// 		callback(null, volume.substring(2));
// 	}, 'Unable to change the volume');
// }

// /**
//  * Decrease the volume by 0.5dB
//  *
//  * @param   function  callback
//  */
// denon.prototype.setVolumeDown = function (callback) {
// 	this.send('MVDOWN', new RegExp('[A-Z]{2}[0-9]{2,3}$'), function (err, volume) {
// 		if (err) {
// 			callback(err);
// 			return;
// 		}

// 		callback(null, volume.substring(2));
// 	}, 'Unable to change the volume');
// }

// /**
//  * Set the volume at a specific level (0-99)
//  *
//  * @param   int       level
//  * @param   function  callback
//  */
// denon.prototype.setVolumeAscii = function (level, callback) {
// 	this.send('MV' + level, new RegExp('[A-Z]{2}[0-9]{2,3}$'), function (err, volume) {
// 		if (err) {
// 			callback(err);
// 			return;
// 		}

// 		callback(null, volume.substring(2));
// 	}, 'Unable to change the volume');
// }

// /**
//  * Set the volume at a specific dB level (+1.0 to -80.5)
//  *
//  * @param   int       level
//  * @param   function  callback
//  */
// denon.prototype.setVolumeDb = function (level, callback) {
// 	level = this.parseDbVolume(level);

// 	this.send('MV' + level, new RegExp('[A-Z]{2}[0-9]{2,3}$'), function (err, volume) {
// 		if (err) {
// 			callback(err);
// 			return;
// 		}

// 		callback(null, volume.substring(2));
// 	}, 'Unable to change the volume');
// }

// /**
//  * Get the current volume level
//  *
//  * @param   function  callback
//  */
// denon.prototype.getVolumeLevel = function (callback) {
// 	this.send('MV?', new RegExp('[A-Z]{2}[0-9]{2,3}$'), function (err, volume) {
// 		if (err) {
// 			callback(err);
// 			return;
// 		}

// 		callback(null, volume.substring(2));
// 	}, 'Unable to get current volume');
// }

// /**
//  * Set the mute state
//  *
//  * @param   bool      state
//  * @param   function  callback
//  */
// denon.prototype.setMuteState = function (state, callback) {
// 	var cmd = 'MUOFF';

// 	if (state) {
// 		cmd = 'MUON';
// 	}

// 	this.send(cmd, 'MU', callback, 'Unable to change the mute status');
// }

// /**
//  * Get the current mute state
//  *
//  * @param   function  callback
//  */
// denon.prototype.getMuteState = function (callback) {
// 	this.send('MU?', 'MU', callback, 'Unable to get the current mute status');
// }

// /**
//  * Get the current source
//  *
//  * @param   function  callback
//  */
// denon.prototype.getSource = function (callback) {
// 	this.send('SI?', 'SI', callback, 'Unable to query current source');
// }



// /**
//  * Get the connection created in the transport layer
//  *
//  * @return  object
//  */
// denon.prototype.getConnection = function () {
// 	return this.getTransport().getConnection();
// }

// /**
//  * Parse the volume to dB
//  *
//  * @param   string    volume   As per docs, 50=0db, 505 = -0.5dB
//  * @return  double
//  */
// denon.prototype.parseAsciiVolume = function (volume, zero) {
// 	// if we havn't been provided with the 0dB value, assume it's 80
// 	// Master volume 80=0dB
// 	// Channel volume 50=0dB
// 	if (typeof zero === 'undefined') {
// 		zero = 80;
// 	}

// 	var halfdb = false;

// 	if (volume.length == 3) {
// 		halfdb = true;
// 		volume = volume.substring(0, 2);
// 	}

// 	volume = parseInt(volume) - zero;

// 	if (halfdb) {
// 		volume += 0.5;
// 	}

// 	return volume;
// }

// denon.prototype.parseDbVolume = function (volume, zero) {
// 	// if we havn't been provided with the 0dB value, assume it's 80
// 	// Master volume 80=0dB
// 	// Channel volume 50=0dB
// 	if (typeof zero === 'undefined') {
// 		zero = 80;
// 	}

// 	var halfdb = false;

// 	if (volume % 1 !== 0) {
// 		halfdb = true;
// 		volume = Math.floor(volume);
// 	}

// 	volume = (volume + zero).toString();

// 	if (halfdb) {
// 		volume += '5';
// 	}

// 	return volume;
// }

// module.exports = denon;