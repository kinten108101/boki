/**
 * @typedef {{
 *  	disconnect(id: number): void;
 *      disconnectAll(): void;
 *      signalHandlerIsConnected(id: number): boolean;
 * }} SharedSignalMethods
 */

/**
 * @typedef {{
 * 		connect: {
 * 			(signal: 'items-changed', cb: (obj: any, position: number, added: number, removed: number) => void): number;
 * 		},
 *      emit: {
 *          (signal: 'items-changed', position: number, added: number, removed: number): void;
 *      },
 * } & SharedSignalMethods} ListModelSignalMethods
 */

