let Request = require('../http/request')
let Primedice = require('../api/primedice')

let bot = exports
async function sleep(ms) {
    let timeout = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    return await timeout(ms);
}

bot.Bot = class Bot {
    constructor(api) {
        this.api = api;
        this.shutdown = false;
        this.requestErrCount = 0;

        this.balance = 0;
        this.condition_high = false;
        this.target = 49.5;

        const self = this;

        process.stdin.resume();
        process.on("SIGTERM", (self) => {
            console.log('SIGTERM');
            console.log(this);
            this.shutdown = true;
        });

        process.on("SIGINT", (self) => {
            console.log('SIGINT');
            console.log(this);
            this.shutdown = true;
        });

    }

    async run() {
        console.log('checking authentication');

        let authed = await this.api.authenticate();
        if (!authed) {
            console.log('unable to authenticate');
            return false;
        }

        while (!this.shutdown) {
            console.log('run');

            let response = await this.api.request_roll(0, 49.5, false);
            if (!response) {
                await sleep(500);
            }
            console.log(response);
        }

        console.log('left run loop');
        process.exit(0);
    }
}

// temporary
let pdAPI = new Primedice.api(
    {
        username: '',
        token: ''
    }
);

let Bot = bot.Bot;

class MyBot extends Bot {
    constructor(api) {
        super(api);
    }

    my_wager() {
        return 0;
    }
}

let mybot = new MyBot(pdAPI);
mybot.run();

