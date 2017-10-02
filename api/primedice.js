"use strict"

const Request = require('../http/request');
const Game = require('./game_api');

let request = new Request.Request();
let GameAPI = Game.API;

let Primedice = exports;

Primedice.API = class PrimeDiceAPI extends GameAPI {
    constructor(global_config, api_config, bot) {
        super(global_config, api_config, bot);

        this.api_is_nonce_based = true;

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
        console.log(user_info);

        if (user_info !== null) {
            if (typeof(this.api_config.last_nonce) === 'number') {
                this.expect_next_nonce = this.api_config.last_nonce+1;
                if (this.api_config.prompt_on_nonce_mismatch) {
                    if (this.expect_next_nonce != user_info.nonce) {
                        console.log('expected', this.expect_next_nonce, 'user_info.nonce', user_info.nonce, user_info);
                        let quit_wanted = Game.prompt('Nonce mismatch, next nonce is ' + user_info.nonce + ' but ' + this.api_config.last_nonce + ' is in the profile configuration, press `q` to quit: ');
                        if (quit_wanted.length > 0 && quit_wanted.toLowerCase() === 'q') {
                            return false;
                        }
                    } else {
                        console.log('nonce consistent with saved profile');
                    }
                }
                this.nonce = user_info.nonce;

            }
            this.bot.balance = user_info.balance;
        }
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

        //this.bot.balance = bet.user.balance;

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

        return user_info.user;
    }
}
