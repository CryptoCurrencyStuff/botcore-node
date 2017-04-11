"use strict"

const Request = require('../http/request')
const Game = require('../api/game_api')
const PrimeDice = require('../api/primedice')

let bot = exports;
bot.Game = Game;
bot.PrimeDice = PrimeDice;

bot.Bot = class Bot {
    constructor(api) {
        this.api = api;
        this.shutdown = false;
        this.requestErrCount = 0;

        this.balance = 0;
        this.condition_high = false;
        this.target = 49.5;

        const self = this;

        //process.stdin.resume();
        process.on("SIGTERM", () => {
            console.log('SIGTERM');
            this.shutdown = true;
        });

        process.on("SIGINT", () => {
            console.log('SIGINT');
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

        let target = this.get_target();
        let wager = this.get_wager();
        console.log(target, wager);
        return false;

        console.log('running');

        while (!this.shutdown) {

            let target = this.get_target();
            let wager = this.get_wager();

            let roll = await this.api.request_roll(wager, target.target, target.condition_high);
            if (roll !== null) {
                console.log(roll.wager, roll.roll);
            } else {
                console.log('bet_error');
                await sleep(1000);
            }

            await sleep(1000);
        }

        console.log('left run loop');
        return false;
    }

    get_wager() {
        console.error('You must implement get_wager');
        process.exit(0);
    }

    get_target() {
        console.error('You must implement get_target');
        process.exit(0);
    }
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
