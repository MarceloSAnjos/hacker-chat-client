import Event from 'events';

export default class SocketClient {
    #serverConnection = {};
    #serverListener = new Event();

    constructor({ host, port, protocol }) {
        this.host = host;
        this.port = port;
        this.protocol = protocol;
    }

    async sendMessage(event, message) {
        this.#serverConnection.write(JSON.stringify({ event, message }));
    }

    attachEvents(events) {
        this.#serverConnection.on('data', data => {
            try {
                data
                    .toString()
                    .split('\n')
                    .filter(line => !!line)
                    .map(JSON.parse)
                    .map(({ event, message }) => {
                        this.#serverListener.emit(event, message);
                    })
            } catch (error) {
                console.log('invalid', data.toString(), error);
            }

        })

        this.#serverListener.on('end', () => {
            console.log('I disconnected!!');
        })

        this.#serverListener.on('error', (error) => {
            console.log('DEU RUIM!!', error);
        })

        for (const [key, value] of events) {
            this.#serverListener.on(key, value);
        }
    }

    async createConnection() {
        const options = {
            port: 9898,
            host: 'localhost',
            headers: {
                Connection: 'Upgrade',
                Upgrade: 'websocket'
            }
        }

        const http = await import(this.protocol);

        const req = http.request(options);
        req.end();

        return new Promise(resolve => {
            req.once('upgrade', (res, socket) => resolve(socket))
        })
    }

    async initialize() {
        this.#serverConnection = await this.createConnection();
        console.log('I connected to the server!!');
    }
}