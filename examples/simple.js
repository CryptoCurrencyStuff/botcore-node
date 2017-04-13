let botcore = require('../index')

class MyBot extends botcore.bot.Bot {
    constructor(api) {
        super(api);
    }

    get_wager() {
        return 0;
    }

    get_target() {
        return {target: 49.5, condition_high: false};
    }
}

async function initialize() {
    let api = await botcore.initialize_api(botcore.options.site, botcore.options.profile);
    let mybot = new MyBot(api);
    await mybot.run();
}

initialize();
