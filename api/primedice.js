"use strict"

const Request = require('../http/request');
const Game = require('./game_api');

let request = new Request.Request();
let GameAPI = Game.API;

let Primedice = exports;

Primedice.API = class PrimeDiceAPI extends GameAPI {
    constructor(api_config, bot) {
        super(api_config, bot);

        if (typeof(api_config.apikey) === 'string' && api_config.apikey !== "") {
            this.auth_str = "apikey=" + api_config.apikey;
        } else {
            this.auth_str = "access_token=" + api_config.token;
        }

        this.base_uri = 'https://api.primedice.com/api';
        this.house_edge = 0.01;
    }

    async create_profile(username, auth_str, is_apikey) {
        if (is_apikey) {

        } else {

        }
    }

    async authenticate() {
        let user_info = await this.request_user_info();
        return user_info !== null;
    }

    async request_roll(wager, target, condition_high) {
        let query = "&amount=" + wager + "&target=" + target + "&condition=" + (condition_high ? '>' : '<');

        let response = await request.post(
            this.base_uri + '/bet?' + this.auth_str, query
        );
        if (response === null)
            return null;

        let bet = null;

        try {
            bet = JSON.parse(response);
        } catch (e) {
            console.error('err', e);
            return null;
        }

        this.bot.balance = bet.user.balance;

        return this.make_result(
            bet.user.balance,
            bet.bet.nonce,
            bet.bet.id,
            bet.bet.win,
            bet.bet.target,
            bet.bet.condition === '>',
            bet.bet.roll,
            bet.bet.amount,
            bet.bet.profit,
            bet.bet.multiplier
        );
    }

    async request_user_info() {
        let response = await request.get(
            this.base_uri + '/users/1?' + this.auth_str
        );

        if (response === null)
            return null;

        let user_info = null;
        try {
            user_info = JSON.parse(response);
        } catch (e) {
            console.error('err', e);
            return null;
        }

        this.bot.balance = await user_info.balance;

        return user_info;
    }
}
