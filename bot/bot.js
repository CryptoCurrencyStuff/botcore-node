"use strict"

const path = require('path');
const sqlite3 = require('sqlite3')
const prompt = require('prompt-sync')()

const Profile = require('../profile/profile')
const Game = require('../api/game_api')

// Site implementations
const PrimeDice = require('../api/primedice')
const LocalTest = require('../api/localtest')

let bot = exports;
bot.data_dir = path.normalize("./data/");
bot.Game = Game;
bot.PrimeDice = PrimeDice;
bot.LocalTest = LocalTest;

bot.Bot = class Bot {
    constructor() {
        this.api = null;
        this.config = null;

        this.shutdown = false;

        this.interrupt = false;

        this.request_error_count = 0;

        //this.db = new sqlite3.Database('');
        this.balance = 0;

        this.last_bet = null;

        this.wagered = 0;
        this.session_profit = 0;
        this.streak_cost = 0;
        this.total_wins = 0;
        this.total_losses = 0;
        this.curr_streak_wins = 0;
        this.curr_streak_losses = 0;

        process.on("SIGTERM", () => {
            console.log('SIGTERM caught');
            this.interrupt = true;
        });

        process.on("SIGINT", () => {
            console.log('SIGINT caught', this);
            this.interrupt = true;
        });
    }

    async initialize(site, profile) {
        let profiles = new Profile.Profile(bot.data_dir);
        let config_obj = await profiles.load_global_config();
        let profile_obj = await profiles.load_profile(site, profile);
        if (profile === null) {
            console.log('unable to load profile', profile, 'on site', site);
            process.exit(1);
        }

        this.config = config_obj;

        let lsite = site.toLowerCase();
        let api = null;

        switch (lsite) {
            case "primedice": {
                api = new bot.PrimeDice.API(config_obj, profile_obj, this);
                break;
            }

            case "localtest": {
                api = new bot.LocalTest.API(config_obj, profile_obj, this);
                break;
            }

            default: {
                console.log('you must provide an API');
                return false;
            }
        }

        this.api = api;

        // Merge recognized configuration entries when available, in contexts
        // which make sense. Order of precedence is from highest to lowest are:
        //  1) bot implementation script
        //  2) profile object
        //  3) global configuration
        this.wait_for_funds = this.wait_for_funds ||
                profile_obj.wait_for_funds ||
                this.config.wait_for_funds || false;

        this.prompt_on_signal = this.prompt_on_signal ||
                profile_obj.prompt_on_signal ||
                this.config.prompt_on_signal || true;

        this.abort_on_max_error_count = this.abort_on_max_error_count ||
                profile_obj.abort_on_max_error_count ||
                this.config.abort_on_max_error_count || 0;

        this.max_error_count = this.max_error_count ||
                profile_obj.max_error_count ||
                this.config.max_error_count || 10;

        this.min_balance = this.min_balance ||
                profile_obj.min_balance || this.config.min_balance || 0;

        this.max_balance = this.max_balance ||
                profile_obj.max_balance || this.config.max_balance || 0;

        this.max_profit = this.max_profit ||
                profile_obj.max_profit || this.config.max_profit || 0;

        this.max_loss = this.max_loss || profile_obj.max_loss ||
                this.config.max_loss || 0;

        this.low_gaps = profile_obj.low_gaps || [
            { chance: 0.01, nonce: -1, score: 0 },
            { chance: 0.02, nonce: -1, score: 0 },
            { chance: 0.03, nonce: -1, score: 0 },
            { chance: 0.04, nonce: -1, score: 0 },
            { chance: 0.05, nonce: -1, score: 0 },
            { chance: 0.06, nonce: -1, score: 0 },
            { chance: 0.07, nonce: -1, score: 0 },
            { chance: 0.08, nonce: -1, score: 0 },
            { chance: 0.09, nonce: -1, score: 0 },
            { chance: 0.10, nonce: -1, score: 0 },
            { chance: 0.11, nonce: -1, score: 0 },
            { chance: 0.12, nonce: -1, score: 0 },
            { chance: 0.13, nonce: -1, score: 0 },
            { chance: 0.14, nonce: -1, score: 0 },
            { chance: 0.15, nonce: -1, score: 0 },
            { chance: 0.16, nonce: -1, score: 0 },
            { chance: 0.17, nonce: -1, score: 0 },
            { chance: 0.18, nonce: -1, score: 0 },
            { chance: 0.19, nonce: -1, score: 0 },
            { chance: 0.20, nonce: -1, score: 0 },
            { chance: 0.21, nonce: -1, score: 0 },
            { chance: 0.22, nonce: -1, score: 0 },
            { chance: 0.23, nonce: -1, score: 0 },
            { chance: 0.24, nonce: -1, score: 0 },
            { chance: 0.25, nonce: -1, score: 0 }
        ];

        this.high_gaps = profile_obj.high_gaps || [
            { chance: 0.01, nonce: -1, score: 0 },
            { chance: 0.02, nonce: -1, score: 0 },
            { chance: 0.03, nonce: -1, score: 0 },
            { chance: 0.04, nonce: -1, score: 0 },
            { chance: 0.05, nonce: -1, score: 0 },
            { chance: 0.06, nonce: -1, score: 0 },
            { chance: 0.07, nonce: -1, score: 0 },
            { chance: 0.08, nonce: -1, score: 0 },
            { chance: 0.09, nonce: -1, score: 0 },
            { chance: 0.10, nonce: -1, score: 0 },
            { chance: 0.11, nonce: -1, score: 0 },
            { chance: 0.12, nonce: -1, score: 0 },
            { chance: 0.13, nonce: -1, score: 0 },
            { chance: 0.14, nonce: -1, score: 0 },
            { chance: 0.15, nonce: -1, score: 0 },
            { chance: 0.16, nonce: -1, score: 0 },
            { chance: 0.17, nonce: -1, score: 0 },
            { chance: 0.18, nonce: -1, score: 0 },
            { chance: 0.19, nonce: -1, score: 0 },
            { chance: 0.20, nonce: -1, score: 0 },
            { chance: 0.21, nonce: -1, score: 0 },
            { chance: 0.22, nonce: -1, score: 0 },
            { chance: 0.23, nonce: -1, score: 0 },
            { chance: 0.24, nonce: -1, score: 0 },
            { chance: 0.25, nonce: -1, score: 0 }
        ];

        console.log('checking authentication');
        let authed = await this.api.authenticate();
        if (!authed) {
            console.log('unable to authenticate');
            return false;
        }

        return true;
    }

    async run() {
        console.log('running');

        let last_loop_ts = Date.now();

        while (!this.shutdown) {
            if (this.interrupt) {
                if (this.prompt_on_signal) {
                    let quit_wanted = prompt('Caught signal, press `y` to quit: ');
                    if (quit_wanted.length > 0 && quit_wanted.toLowerCase() === 'y') {
                        this.shutdown = true;
                        break;
                    }
                } else {
                    this.shutdown = true;
                    break;
                }
                this.interrupt = false;
            }

            const bet_opts = await this.get_bet_options();

            if (this.balance < bet_opts.wager) {
                if (this.wait_for_funds) {
                    console.log('waiting for funds');
                    await this.sleep(10000);
                    continue;
                } else {
                    console.log('insufficient funds, shutting down');
                    this.shutdown = true;
                    break;
                }
            }

            if (this.max_balance > 0 && this.balance >= this.max_balance) {
                this.shutdown = true;
                break;
            }

            if (this.min_balance > 0 && this.balance <= this.min_balance) {
                this.shutdown = true;
                break;
            }

            if (this.max_loss > 0 && this.streak_cost >= this.max_loss) {
                this.shutdown = true;
                break;
            }

            if (this.max_profit > 0 && this.session_profit >= this.max_profit) {
                this.shutdown = true;
                break;
            }

            const roll = await this.api.request_roll(bet_opts.wager, bet_opts.target, bet_opts.condition_high);
            if (roll === null) {
                this.request_error_count++;

                if (this.abort_on_max_error_count && this.request_error_count >= this.max_error_count) {
                    console.log('max error count reached, aborting');
                    this.shutdown = true;
                    break;
                }

                if (this.request_error_count < 5)
                    await this.sleep(1000);
                else
                    await this.sleep(5000);
                continue;
            }

            this.request_error_count = 0;

            this.wagered += roll.wager;
            this.streak_cost += roll.wager;

            if (roll.won) {
                this.total_wins++;
                this.curr_streak_wins++;
                this.curr_streak_losses = 0;
            } else {
                this.total_losses++
                this.curr_streak_losses++;
                this.curr_streak_wins = 0;
            }

            this.balance = roll.balance;
            this.session_profit += roll.profit;

            this.updategaps(roll.nonce, roll.roll);
            if (roll.nonce != 0 && roll.nonce % 200 == 0)
                console.log('low_gaps', this.low_gaps, '\nhigh_gaps', this.high_gaps);
            this.print_bet_result(roll);

            if (roll.won)
                this.streak_cost = 0;

            this.last_bet = roll;
            this.config.nonce = roll.nonce;
            this.api.nonce = roll.nonce;

            let loop_ts = Date.now();
            if (loop_ts - last_loop_ts > 10) {
                // Give the nodejs loop a chance to run
                await this.sleep(0);
                last_loop_ts = loop_ts;
            }
        }

        console.log('left run loop');
        return false;
    }

    async sleep(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async get_bet_options() {
        console.error('You must implement do_bet');
        process.exit(0);
    }

    make_target(value, condition_high, is_chance) {
        let target_obj = { target: 0, chance: 0, condition_high: condition_high };

        value = Math.round(value*100);

        if (is_chance) {
            target_obj.chance = value/100;

            if (condition_high) {
                target_obj.target = (9999-value)/100;
            } else {
                target_obj.target = value/100;
            }
        } else {
            target_obj.target = value/100;

            if (condition_high) {
                target_obj.chance = (9999-value)/100;
            } else {
                target_obj.chance = value/100;
            }
        }

        this.roundtoprecision(target_obj.target, 2);
        this.roundtoprecision(target_obj.chance, 2);

        return target_obj;
    }

    getwagerforprofit(chance, streakcost, minprofit, stepped) {
        if (minprofit == 0)
            return 0;

        streakcost = streakcost < 0 ? 0 : streakcost;
        minprofit = minprofit < 0.0001 ? 0.0001 : minprofit;

        const payout = this.getpayout(chance);
        let wager = 1;

        while ((wager*payout)-wager < streakcost + minprofit)
            wager = Math.round(wager*2);

        if (!stepped) {
            while (wager > 0 && ((wager-1)*payout)-(wager-1) > streakcost + minprofit)
                wager -= 1;
        }

        if (wager < 1)
            wager = 1;

        return wager;
    }

    roundtoprecision(value, precision) {
        const power = Math.pow(10, precision);
        return Math.floor(value*power)/power;
    }

    getpayout(chance) {
        let payout = this.roundtoprecision(100./chance*(1.0-this.api.house_edge), 5);
        return payout;
    }

    updategaps(nonce, roll) {
        for (let i = 0; i < this.low_gaps.length; ++i) {
            if (roll < this.low_gaps[i].chance)
                this.low_gaps[i].nonce = nonce;
        }
        this.computegapscores(this.low_gaps, nonce);

        for (let i = 0; i < this.high_gaps.length; ++i) {
            if (roll > (9999-Math.round(this.high_gaps[i].chance*100))/100)
                this.high_gaps[i].nonce = nonce;
        }
        this.computegapscores(this.high_gaps, nonce);
    }

    computegapscores(gaps, nonce) {
        let score;

        for (let i = 0; i < gaps.length; ++i) {
            score = 0.0;
            if (gaps[i].nonce >= 0) {
                score = (nonce-gaps[i].nonce)*gaps[i].chance/100;
                score = Math.round(score*1e5)/1e5;
                gaps[i].score = score;
            }
        }
    }

    getexceedinggaps(gaps, score, minchance, maxchance) {
        let exceeding_gaps = [];

        for (let i = 0; i < gaps.length; ++i) {
            if (gaps[i].chance >= minchance && gaps[i].chance <= maxchance && gaps[i].score >= score) {
                if (gaps[i].chance >= minchance && gaps[i].chance <= maxchance) {
                    exceeding_gaps.push(gaps[i]);
                }
            }
        }

        return exceeding_gaps;
    }

    gethighgapscore(gaps, minchance, maxchance) {
        let gapidx = -1;
        let highscore = 0.0;
        let score = 0.0;

        minchance = minchance || 0.01;
        maxchance = maxchance || 98.0;

        minchance = Math.round(minchance*100)/100;
        maxchance = Math.round(maxchance*100)/100;

        for (let i = 0; i < gaps.length; ++i) {
            score = 0.0;
            if (gaps[i].nonce >= 0) {
                if (gaps[i].chance >= minchance && gaps[i].chance <= maxchance) {
                    score = gaps[i].score;
                    if (score > highscore) {
                        highscore = score;
                        gapidx = i;
                    }
                }
            }
        }

        let gap = null;
        if (gapidx >= 0) {
            gap = gaps[gapidx];
            return { chance: gap.chance, score: highscore };
        }

        return { chance: 0, score: 0 };
    }

    getlowestgapofscore(gaps, minchance, maxchance, minscore) {
        let gapidx = -1;
        let score = 0.0;
        let highscore = 0.0;

        minchance = minchance || 0.01;
        maxchance = maxchance || 98.0;

        minchance = Math.round(minchance*100)/100;
        maxchance = Math.round(maxchance*100)/100;

        for (let i = gaps.length-1; i > 0; --i) {
            score = 0.0;
            if (gaps[i].nonce >= 0) {
                if (gaps[i].chance >= minchance && gaps[i].chance <= maxchance) {
                    score = gaps[i].score;
                    if (score > minscore) {
                        highscore = score;
                        gapidx = i;
                    }
                }
            }
        }

        let gap = null;
        if (gapidx >= 0) {
            gap = gaps[gapidx];
            return { chance: gap.chance, score: highscore };
        }

        return { chance: 0, score: 0 };
    }

    print_bet_result(roll) {
        const ansi_seq_end = '\x1b[0m';
        const pink = [ '\x1b[1;35m', ansi_seq_end ];
        const blue = [ '\x1b[1;34m', ansi_seq_end ];
        const green = [ '\x1b[1;32m', ansi_seq_end ];
        const red = [ '\x1b[1;31m', ansi_seq_end ];

        const seqs = [ green, red ];
        const use = roll.won ? 0 : 1;

        const pad = (num, size) => {
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
        if (roll.roll < this.low_gaps[this.low_gaps.length-1].chance ||
            roll.roll > 99.99-this.high_gaps[this.high_gaps.length-1].chance) {
            roll_string = pink[0] + pad(roll.roll.toFixed(2), 5) + pink[1];
        } else {
            roll_string = pad(roll.roll.toFixed(2), 5);
        }

        let target_string = pad(roll.target.toFixed(2), 5);
        console.log(
            this.api.api_config.username + ' ' +
            Math.floor(Date.now() / 1000) + ' ' +
            roll.bet_id + ' ' + roll.nonce + ' ' +
            (roll.condition_high ? '>' : '<') +
            target_string + ' ' + roll_string + ' ' +
            Math.floor(this.balance).toFixed(0) +
            '(' + seqs[use][0] + roll.profit.toFixed(0) + seqs[use][1] + ') ' +
            'bet ' + this.wagered.toFixed(0) +  ' ' +
            streak_string + ' cost(' + this.streak_cost.toFixed(0) + ')'
            //(roll.won ? (this.streak_cost-roll.wager).toFixed(0) : this.streak_cost.toFixed(0)) + ')'
        );
    }
}
