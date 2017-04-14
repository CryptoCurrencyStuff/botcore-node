"use strict"

const sqlite3 = require('sqlite3')

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

        //this.db = new sqlite3.Database('');
        this.balance = 0;
        this.target = { };
        this.wager = 0;

        this.wagered = 0;
        this.streak_cost = 0;
        this.total_wins = 0;
        this.total_losses = 0;
        this.curr_streak_wins = 0;
        this.curr_streak_losses = 0;

        // TODO support asking user to confirm shutdown
        process.on("SIGTERM", () => {
            console.log('SIGTERM');
            this.shutdown = true;
        });

        process.on("SIGINT", () => {
            console.log('SIGINT');
            this.shutdown = true;
        });
    }

    print_bet_result(roll) {
        const ansi_seq_end = '\x1b[0m';
        const pink = [ '\x1b[1;35m', ansi_seq_end ];
        const blue = [ '\x1b[1;34m', ansi_seq_end ];
        const green = [ '\x1b[1;32m', ansi_seq_end ];
        const red = [ '\x1b[1;31m', ansi_seq_end ];

        const seqs = [ green, red ];
        const use = roll.won ? 0 : 1;

        const pad = function(num, size) {
            let s = num + "";
            while (s.length < size)
                s = "0" + s;
            return s;
        }

        let streak_string = '(';
        if (roll.won) {
            streak_string += green[0] + 'W' + this.curr_streak_wins + green[1];
        } else {
            streak_string += red[0] + 'L' + this.curr_streak_losses + red[1];
        }
        streak_string += ')';

        let roll_string = '';
        //if (roll.roll < 1.0 || roll.roll > 99.99-1.0) {
            //roll_string = pink[0] + pad(roll.roll.toFixed(2), 5) + pink[1];
        //} else {
            roll_string = pad(roll.roll.toFixed(2), 5);
        //}

        let target_string = pad(roll.target.toFixed(2), 5);

        console.log(
            this.api.config.username + ' ' +
            Math.floor(Date.now() / 1000) + ' ' +
            roll.bet_id + ' ' + roll.nonce + ' ' +
            (roll.condition_high ? '>' : '<') +
            target_string + ' ' + roll_string + ' ' +
            Math.floor(this.balance).toFixed(0) +
            '(' + seqs[use][0] + roll.profit.toFixed(0) + seqs[use][1] + ') ' +
            'bet ' + this.wagered.toFixed(0) +  ' ' +
            streak_string + ' cost(' +
            (roll.won ? (this.streak_cost-roll.wager).toFixed(0) : this.streak_cost.toFixed(0)) + ')'
        );
    }

    async run() {
        console.log('checking authentication');
        let authed = await this.api.authenticate();
        if (!authed) {
            console.log('unable to authenticate');
            return false;
        }

        console.log('running');

        while (!this.shutdown) {
            const target = this.get_target();
            const wager = this.get_wager();

            let roll = await this.api.request_roll(wager, target.target, target.condition_high);
            if (roll === null) {
                console.log('bet_error', this.requestErrCount);
                if (this.requestErrCount > 5)
                    await sleep(5000);
                else
                    await sleep(1000);
                this.requestErrCount++;
                continue;
            }

            this.requestErrCount = 0;

            this.wagered += roll.wager;

            const won = roll.won;
            if (won) {
                this.streak_cost = 0;

                this.total_wins++;
                this.curr_streak_wins++;
                this.curr_streak_losses = 0;
            } else {
                this.streak_cost += roll.wager;

                this.total_losses++
                this.curr_streak_losses++;
                this.curr_streak_wins = 0;
            }

            this.print_bet_result(roll);
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

    getwagerforprofit(chance, streakcost, minprofit, stepped) {
        streakcost = streakcost < 0 ? 0 : streakcost;
        minprofit = minprofit < 0.0001 ? 0.0001 : minprofit;

        let payout = this.getpayout(chance);
        let wager = 1;

        while ((wager*payout)-wager < streakcost + minprofit)
            wager = Math.round(wager*2);

        if (!stepped) {
            while (wager > 0 && ((wager-1)*payout)-(wager-1) > streakcost + minprofit)
                wager -= 1;
        }

        if(wager < 1)
            wager = 1;

        return wager;
    }

    roundtoprecision(value, precision) {
        let power = Math.pow(10, precision);
        return Math.floor(value * power) / power;
    }

    getpayout(chance) {
        return this.roundtoprecision(100./chance*(1.0-this.api.house_edge), 5);
    }
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
