"use strict"

const botcore = require('../index')

class MyBot extends botcore.bot.Bot {
    constructor(config) {
        super(config);

        this.state = 0;
        this.base_wager = 512;
    }

    get_bet_options() {
        let bet_opts = { target: 48, condition_high: false, wager: 0 };

        let exceeding_low = this.getexceedinggaps(this.lowgaps, 4.0, 0.01, 0.35);
        let exceeding_high = this.getexceedinggaps(this.highgaps, 4.0, 0.01, 0.35);
        let low_gaps_score = 0;
        let high_gaps_score = 0;

        for (let i = 0; i < exceeding_low.length; ++i) {
            low_gaps_score += exceeding_low[i].score;
        }

        for (let i = 0; i < exceeding_high.length; ++i) {
            high_gaps_score += exceeding_high[i].score;
        }

        // update current state
        if (this.state == 2) {
            if (this.last_bet.won) {
                this.state = 0;
            }
        }

        if (this.state == 1) {
            if (this.last_bet.won) {
                this.state = 0;
                bet_opts.wager = 0;
            }

            if (this.streak_cost >= 1000) {
                this.state = 2
            }
        }

        if (this.state == 0) {
            if (low_gaps_score > 0 || high_gaps_score > 0) {
                this.state = 1;
                bet_opts.wager = this.base_wager;
            }
        }

        // update bet_opts according to current state
        if (this.state == 1) {
            //console.log('state=1');
            if (this.streak_cost == 0) {
                bet_opts.wager = this.base_wager;
            } else if (this.streak_cost < 1000) {
                bet_opts.wager = this.last_bet.wager * 2;
            } else {
                if (high_gaps_score > low_gaps_score) {
                    bet_opts.target = 99.99-48;
                    bet_opts.condition_high = true;
                    bet_opts.wager = this.base_wager;
                } else {
                    bet_opts.target = 48;
                    bet_opts.condition_high = false;
                    bet_opts.wager = this.base_wager;
                }
            }
        } else if (this.state == 2) {
            //console.log('state=2', this.streak_cost);
            if (low_gaps_score > 0 || high_gaps_score > 0) {
                if (high_gaps_score > low_gaps_score) {
                    let gap = null;
                    for (let i = 0; i < exceeding_high.length; ++i) {
                        if (gap === null || exceeding_high[i].score > gap.score) {
                            gap = exceeding_high[i];
                        }
                    }

                    let target = 99.99-gap.chance;
                    //console.log(target);
                    bet_opts.target = target;
                    bet_opts.condition_high = true;
                    bet_opts.wager = this.getwagerforprofit(99.99-target, this.streak_cost, 100, true);
                } else {
                    let gap = null;
                    for (let i = 0; i < exceeding_low.length; ++i) {
                        if (gap === null || exceeding_low[i].score > gap.score) {
                            gap = exceeding_low[i];
                        }
                    }

                    let target = gap.chance;
                    //console.log(target);
                    bet_opts.target = target
                    bet_opts.condition_high = false
                    bet_opts.wager = this.getwagerforprofit(target, this.streak_cost, 100, true);
                }
                //console.log(bet_opts);
            }
        }

        return bet_opts;
    }
}

(function() {
    let init = async function() {
        let api = await botcore.initialize_api(botcore.options.site, botcore.options.profile);
        api.bot = new MyBot();
        await api.bot.run(api);
        process.exit(0);
    }
    init();
})()
