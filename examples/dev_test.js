"use strict"

const botcore = require('../index')

class MyBot extends botcore.bot.Bot {
    constructor() {
        super();

        this.state = 0;
        this.base_wager = 7000;
        this.base_score = 0.0;
        this.max_profit = 2000000000;

        this.max_score = 0.0;
    }

    async get_bet_options() {
        let bet_opts = { target: 48, condition_high: false, wager: 0 };

        let exceeding_low = this.getexceedinggaps(this.low_gaps, this.base_score, 0.01, 0.1);
        let exceeding_low_second = this.getexceedinggaps(this.low_gaps, this.base_score, 0.01, 0.20);
        let exceeding_high = this.getexceedinggaps(this.high_gaps, this.base_score, 0.01, 0.1);
        let exceeding_high_second = this.getexceedinggaps(this.high_gaps, this.base_score, 0.01, 0.20);

        let low_gaps_score = 0;
        let high_gaps_score = 0;
        let low_gaps_score_second = 0;
        let high_gaps_score_second = 0;

        for (let i = 0; i < exceeding_low.length; ++i) {
            low_gaps_score += exceeding_low[i].score;
        }

        for (let i = 0; i < exceeding_high.length; ++i) {
            high_gaps_score += exceeding_high[i].score;
        }

        for (let i = 0; i < exceeding_low_second.length; ++i) {
            low_gaps_score_second += exceeding_low_second[i].score;
        }

        for (let i = 0; i < exceeding_high_second.length; ++i) {
            high_gaps_score_second += exceeding_high_second[i].score;
        }

        if (low_gaps_score > this.max_score) {
            if (low_gaps_score-this.max_score > 10) {
                this.max_score = low_gaps_score;
                console.log('lgs', low_gaps_score);
                await this.sleep(1000);
            }
        }

        if (high_gaps_score > this.max_score) {
            if (high_gaps_score-this.max_score > 10) {
                this.max_score = high_gaps_score;
                console.log('hgs', high_gaps_score);
                await this.sleep(1000);
            }
        }

        let lgs1 = this.gethighgapscore(exceeding_low, 0.01, 0.1);
        let lgs2 = this.gethighgapscore(exceeding_low_second, 0.01, 0.2);
        let hgs1 = this.gethighgapscore(exceeding_high, 0.01, 0.1);
        let hgs2 = this.gethighgapscore(exceeding_high_second, 0.01, 0.2);

        // update current state
        if (this.state == 2) {
            if (this.last_bet.won) {
                this.state = 0;
                //this.base_score += 0.25;
            }
        }

        if (this.state == 1) {
            if (this.last_bet.won) {
                this.state = 0;
                bet_opts.wager = 0;
            } else if (this.streak_cost >= 100000) {
                this.state = 2
            }
        }

        if (this.state == 0) {
            if ((low_gaps_score > 30 && low_gaps_score_second > 60 && lgs2.score > lgs1.score+2) || (high_gaps_score > 30 && high_gaps_score_second > 60 && hgs2.score > hgs1.score+2)) {
                this.state = 1;
                bet_opts.wager = this.base_wager;
            }
        }

        // update bet_opts according to current state
        if (this.state == 1) {
            if (low_gaps_score_second > 0 || high_gaps_score_second > 0) {
                if (high_gaps_score_second > low_gaps_score_second) {
                    let gap = this.gethighgapscore(exceeding_high_second, 0.01, 0.2);
                    bet_opts = this.make_target(48, true, true);
                } else {
                    let gap = this.gethighgapscore(exceeding_low_second, 0.01, 0.2);
                    bet_opts = this.make_target(48, false, true);
                }
            }

            if (this.streak_cost == 0) {
                bet_opts.wager = this.base_wager;
            } else if (this.streak_cost < 100000) {
                bet_opts.wager = this.last_bet.wager * 2;
            }

        } else if (this.state == 2) {
            if (low_gaps_score_second > 0 || high_gaps_score_second > 0) {
                const amount = Math.round(this.balance*0.0033 <= 500000000 ? this.balance*0.0033 : 500000000);

                if (high_gaps_score_second > low_gaps_score_second) {
                    let gap = this.gethighgapscore(exceeding_high_second, 0.01, 0.2);
                    bet_opts = this.make_target(gap.chance, true, true);
                    bet_opts.wager = this.getwagerforprofit(bet_opts.chance, this.streak_cost, amount, false);
                } else {
                    let gap = this.gethighgapscore(exceeding_low_second, 0.01, 0.2);
                    bet_opts = this.make_target(gap.chance, false, true);
                    bet_opts.wager = this.getwagerforprofit(bet_opts.chance, this.streak_cost, amount, false);
                }
            }
        }

        return bet_opts;
    }
}

(function() {
    let init = async () => {
        let bot = new MyBot();
        let success = await bot.initialize(botcore.options.site, botcore.options.profile);
        if (success)
            await bot.run();

        process.exit(0);
    }
    init();
})()
