"use strict"

const Game = require('./game_api');

let GameAPI = Game.API;

let LocalTest = exports;

LocalTest.API = class LocalTestAPI extends GameAPI {
    constructor(api_config, bot) {
        super(api_config, bot);

//        console.log(api_config, bot);

        if (typeof(api_config.apikey) === 'string' && api_config.apikey !== "") {
            this.auth_str = "apikey=" + api_config.apikey;
        } else {
            this.auth_str = "access_token=" + api_config.token;
        }

        this.base_uri = 'https://api.primedice.com/api';
        this.house_edge = 0.01;

        this.nonce = 0;
        this.balance = 10000000;
    }

    async create_profile(username, auth_str, is_apikey) {
        if (is_apikey) {

        } else {

        }
    }

    async authenticate() {
        return { balance: this.balance, username: this.api_config.username }
    }

    async request_roll(wager, target, condition_high) {
        const roll = Math.floor(Math.random()*10000)/100;

        const roll_target = this.bot.make_roll_target(target, condition_high, false);
        const payout = this.bot.getpayout(roll_target.chance);

        const won = condition_high ? roll > roll_target.target : roll < roll_target.target;
        const profit = won ? wager * payout-wager : -wager;
        this.nonce++;
        this.balance += profit;

        const bet_result = {
            balance: this.balance,
            nonce: this.nonce,
            bet_id: this.nonce,
            won: won,
            target: roll_target.target,
            condition_high: condition_high,
            roll: roll,
            wager: wager,
            profit: profit,
            multiplier: payout
        };

        this.bot.balance = bet_result.balance;

        return bet_result;
    }

    async request_user_info() {
        const user_info = {
            balance: this.balance,
            username: this.api_config.username
        };

        this.balance = await user_info.balance;

        return user_info;
    }
}
