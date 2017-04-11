const Args = require('command-line-args')
const Profile = require('./profile/profile')
const botcore = require('./bot/bot')

class MyBot extends botcore.Bot {
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

const opts = [
    { name: 'site', alias: 's', type: String },
    { name: 'profile', alias: 'p', type: String },
]

const options = Args(opts);
console.log(options)

if (typeof(options.site) !== 'string') {
    console.log('You must specify a site');
    process.exit(1);
}

if (typeof(options.profile) !== 'string') {
    console.log('You must specify a profile');
    process.exit(1);
}

async function initialize() {
    let profiles = new Profile.Profile()
    let profile = await profiles.load_profile(options.site, options.profile);
    if (profile === null) {
        console.log('unable to load profile', options.profile, 'on site', options.site);
        process.exit(1);
    }

    //console.log(profile);

    let site = profile.site.toLowerCase();
    let api = null;
    switch (site) {
        case "primedice": {
            api = new botcore.PrimeDice.API(profile);
            break;
        }

        default: {
            console.log("no such API:", site);
            return false;
        }
    }

    let mybot = new MyBot(api);
    mybot.run();
}

initialize();
