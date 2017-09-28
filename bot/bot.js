"use strict"

const sqlite3 = require('sqlite3')
const prompt = require('prompt-sync')()

const Request = require('../http/request')
const Game = require('../api/game_api')

// Site implementations
const PrimeDice = require('../api/primedice')
const LocalTest = require('../api/localtest')

let bot = exports;
bot.Game = Game;
bot.PrimeDice = PrimeDice;
bot.LocalTest = LocalTest;

bot.Bot = class Bot {
    constructor(config) {
        this.api = null;
        this.config = config;

        this.shutdown = false;

        // TODO move to global configuration
        this.wait_for_funds = true;
        this.prompt_on_signal = true;
        this.request_error_count = 0;
        this.max_error_count = 10;

        //this.db = new sqlite3.Database('');
        this.balance = 0;
        this.target = { };
        this.wager = 0;

        this.last_bet = null;

        this.wagered = 0;
        this.session_profit = 0;
        this.streak_cost = 0;
        this.total_wins = 0;
        this.total_losses = 0;
        this.curr_streak_wins = 0;
        this.curr_streak_losses = 0;

        this.lowgaps = [
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

        this.highgaps = [
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

        process.on("SIGTERM", () => {
            console.log('SIGTERM caught');
            if (this.prompt_on_signal) {
                let quit_wanted = prompt('Caught signal, press `y` to quit: ');
                if (quit_wanted.length > 0 && quit_wanted.toLowerCase() === 'y') {
                    this.shutdown = true;

                }
            } else {
                this.shutdown = true;
            }
        });

        process.on("SIGINT", () => {
            console.log('SIGINT caught');
            if (this.prompt_on_signal) {
                let quit_wanted = prompt('Caught signal, press `y` to quit: ');
                if (quit_wanted.length > 0 && quit_wanted.toLowerCase() === 'y') {
                    this.shutdown = true;

                }
            } else {
                this.shutdown = true;
            }
        });
    }

    async sleep(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
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
            this.api.api_config.username + ' ' +
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

    async run(api) {

        if (api === null) {
            console.log('you must provide an API');
            return false;
        }
        this.api = api;

        console.log('checking authentication');
        let authed = await this.api.authenticate();
        if (!authed) {
            console.log('unable to authenticate');
            return false;
        }

        console.log('running');

        while (!this.shutdown) {
            const bet_opts = this.get_bet_options();

            if (this.balance < bet_opts.wager) {
                if (this.wait_for_funds) {
                     while (!this.shutdown) {
                        await this.sleep(1000);
                    }
                } else {
                    this.shutdown = true;
                    break;
                }
            }

            const roll = await this.api.request_roll(bet_opts.wager, bet_opts.target, bet_opts.condition_high);
            if (roll === null) {
                this.request_error_count++;
                console.log('bet_error count', this.request_error_count);

                if (this.request_error_count >= this.max_error_count) {
                    this.shutdown = true;
                    continue;
                }

                if (this.request_error_count < 5)
                    await this.sleep(1000);
                else
                    await this.sleep(5000);
                continue;
            }

            this.request_error_count = 0;

            this.wagered += roll.wager;

            if (roll.won) {
                this.total_wins++;
                this.curr_streak_wins++;
                this.curr_streak_losses = 0;
            } else {
                this.streak_cost += roll.wager;

                this.total_losses++
                this.curr_streak_losses++;
                this.curr_streak_wins = 0;
            }

            this.updategaps(roll.nonce, roll.roll);
            if (roll.nonce != 0 && roll.nonce % 200 == 0)
                console.log('lowgaps', this.lowgaps, 'highgaps', this.highgaps);
            this.print_bet_result(roll);


            if (roll.won)
                this.streak_cost = 0;

            this.last_bet = roll;

            await this.sleep(0);
        }

        console.log('left run loop');
        return false;
    }

    get_bet_options() {
        console.error('You must implement do_bet');
        process.exit(0);
    }

    make_roll_target(value, condition_high, is_chance) {
        let target_obj = { target: 0, chance: 0, condition_high: condition_high };

        value = Math.round(value*100);

        if (is_chance === true) {
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
        return this.roundtoprecision(100./chance*(1.0-this.api.house_edge), 5);
    }

    updategaps(nonce, roll) {
        for (let i = 0; i < this.lowgaps.length; ++i) {
            if (roll < this.lowgaps[i].chance)
                this.lowgaps[i].nonce = nonce;
        }
        this.computegapscores(this.lowgaps, nonce);

        for (let i = 0; i < this.highgaps.length; ++i) {
            if (roll > (9999-Math.round(this.highgaps[i].chance*100))/100)
                this.highgaps[i].nonce = nonce;
        }
        this.computegapscores(this.highgaps, nonce);
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
            if (gaps[i].score >= score) {
                if (gaps[i].chance >= minchance && gaps[i].chance <= maxchance) {
                    exceeding_gaps.push(gaps[i]);
                }
            }
        }

        return exceeding_gaps;
    }

    gethighgapscore(gaps, nonce, minchance, maxchance) {
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

    getlowestgapofscore(gaps, nonce, minchance, maxchance, minscore) {
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
}
