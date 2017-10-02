"use strict"

const crypto = require('crypto');
const Game = require('./game_api');

let GameAPI = Game.API;

let LocalTest = exports;

LocalTest.API = class LocalTestAPI extends GameAPI {
    constructor(global_config, api_config, bot) {
        super(global_config, api_config, bot);

        this.base_uri = 'https://api.primedice.com/api';
        this.house_edge = 0.01;

        this.server_nonce = 0;
        this.server_balance = 300000;

        this.server_seed = "012f8e9abcde28d3a76fe3d9d8e81f367bc";
        this.client_seed = "client";
    }

    async create_profile(username, auth_str, is_apikey) {
        if (is_apikey) {

        } else {

        }
    }

    async authenticate() {
        return await { balance: this.balance, username: this.api_config.username }
    }

    async request_roll(wager, target, condition_high) {
        const roll = this.secure_rng();

        const roll_target = this.bot.make_target(target, condition_high, false);
        const payout = this.bot.getpayout(roll_target.chance);

        const won = condition_high ? roll > roll_target.target : roll < roll_target.target;
        let profit = 0;
        if (wager != 0) {
            if (won)
                profit = wager*payout-wager;
            else
                profit = -wager;
        }
        this.server_balance += profit;

        const bet_result = await {
            balance: this.server_balance,
            nonce: this.server_nonce,
            bet_id: this.server_nonce,
            won: won,
            target: roll_target.target,
            condition_high: condition_high,
            roll: roll,
            wager: wager,
            profit: profit,
            multiplier: payout
        };

        //this.bot.balance = this.server_balance;
        this.server_nonce++;

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

    secure_rng() {
        //create HMAC using server seed as key and client seed as message
        let hash = crypto.createHmac('sha512', this.server_seed).update(this.client_seed + '-' + this.server_nonce).digest('hex');
        let index = 0;
        let lucky = parseInt(hash.substring(index * 5, index * 5 + 5), 16);

        //keep grabbing characters from the hash while greater than
        while (lucky >= 1e6) {
            index++;
            lucky = parseInt(hash.substring(index * 5, index * 5 + 5), 16);

            //if we reach the end of the hash, just default to highest number
            if (index * 5 + 5 > 128)
                return 99.99;
        }

        lucky %= 1e4;

        //console.log(lucky/100);
        return lucky/100;
    }
}
