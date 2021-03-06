"use strict"

const prompt = require('prompt-sync')()
const fs = require('fs-promise');

const Game = exports;
Game.prompt = prompt;

Game.API = class GameAPI {
    constructor(global_config, api_config, bot) {
        this.global_config = global_config;
        this.api_config = api_config;

        this.bot = bot;

        this.api_is_nonce_based = false;
        this.expect_next_nonce = 0;
        this.nonce = 0;
    }

    async create_profile() {
        console.error('You must implement create_profile');
        process.exit(0);
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

    make_roll_target(target, condition_high, wager) {
        //console.log(target, condition_high, wager);

        return {
            target: target,
            condition_high: condition_high,
            wager: wager
        };
    }
}
