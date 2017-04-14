"use strict"

let Game = exports;

Game.API = class GameAPI {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
    }

    async authenticate() {
        console.error('You must implement authenticate');
        process.exit(0);
    }

    async request_roll(wager, target, condition_high) {
        console.error('You must implement request_roll');
        process.exit(0);
    }

    make_result(balance, nonce, bet_id, won, target, condition_high, roll, wager, profit, payout) {
        //console.log(nonce, bet_id, won, target, condition_high, roll, wager, profit, payout);

        return {
            balance: balance,
            nonce: nonce,
            bet_id: bet_id,
            won: won,
            target: target,
            condition_high: condition_high,
            roll: roll,
            wager: wager,
            profit: profit,
            payout: payout
        };
    }

    make_target(target, condition_high, wager) {
        //console.log(target, condition_high, wager);

        return {
            target: target,
            condition_high: condition_high,
            wager: wager
        };
    }
}
