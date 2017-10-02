"use strict"

const botcore = require('../index')

class MyBot extends botcore.bot.Bot {
    constructor() {
        super();
    }

    async get_bet_options() {
        return await {
            target: 48, condition_high: false, wager: 0
        };
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
