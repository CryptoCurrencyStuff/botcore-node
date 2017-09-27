"use strict"

const botcore = require('../index')

class MyBot extends botcore.bot.Bot {
    constructor(config) {
        super(config);
    }

    get_bet_options() {
        return {
            target: 48, condition_high: false, wager: 0
        };
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
