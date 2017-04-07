let Request = require('../http/request');

const request = new Request.Request();

let game = require('./game_api')
let GameAPI = game.api;

exports.api = class PrimeDiceAPI extends GameAPI {
    constructor(config) {
        super(config);

        this.base_uri = 'https://api.primedice.com/api';
    }

    async authenticate() {
        console.log(this.config.username);
        let user_info = await this.request_user_info();

        return user_info !== null;
    }

    async request_roll(wager, target, condition_high) {
        let query = "&amount=" + wager + "&target=" + target + "&condition=" + (condition_high ? '>' : '<');

        let response = await request.post(
            this.base_uri + '/bet?access_token=' + this.config.token, query
        );

        let bet = null;

        try {
            bet = JSON.parse(response);
        } catch (e) {
            console.error('err', e);
            return null;
        }

        console.log('roll', bet);

        return bet;
    }

    async request_user_info() {
        let response = await request.get(
            this.base_uri + '/users/1?access_token=' + this.config.token
        );

        let user_info = null;

        try {
            user_info = JSON.parse(response);
        } catch (e) {
            console.error('err', e);
            return null;
        }

        return await user_info;
    }

}

let primedice = exports;
