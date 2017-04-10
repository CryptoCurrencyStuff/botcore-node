"use strict"

const fs = require('fs-promise');

const Request = require('../http/request')
const Game = require('../api/game_api')
const PrimeDice = require('../api/primedice')

const Args = require('command-line-args')

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

let bot = exports;

bot.Bot = class Bot {
    constructor() {
        this.api = null;
        this.shutdown = false;
        this.requestErrCount = 0;

        this.balance = 0;
        this.condition_high = false;
        this.target = 49.5;

        const self = this;

        //process.stdin.resume();
        process.on("SIGTERM", () => {
            console.log('SIGTERM');
            this.shutdown = true;
        });

        process.on("SIGINT", () => {
            console.log('SIGINT');
            this.shutdown = true;
        });
    }

    async load_profile(siteName, profileName) {
        console.log('load_profile');
        let profilesData = await fs.readFile('./data/profiles.json');
        let profiles = JSON.parse(profilesData);

        for (let profile of profiles.profiles) {
            if (profile.site.toLowerCase() === siteName.toLowerCase() &&
                    profile.username.toLowerCase() === profileName.toLowerCase()) {
                console.log(profile);
                return profile;
            }
        }

        return null;
        //console.log(profiles_obj);
    }

    async run(siteName, profileName) {
        console.log('loading profile');
        let profile = await this.load_profile(siteName, profileName);
        if (profile === null) {
            console.log('unable to load profile', options.profile, 'on site', options.site);
            return false;
        }

        let site = profile.site.toLowerCase();

        switch (site) {
        case "primedice": {
                this.api = new PrimeDice.API(profile);
                break;
            }

        default: {
                console.log("no such API:", site);
                return false;
            }
        }

        console.log('checking authentication');
        let authed = await this.api.authenticate();
        if (!authed) {
            console.log('unable to authenticate');
            return false;
        }

        let target = this.get_target();
        let wager = this.get_wager();
        console.log(target, wager);
        return false;

        while (!this.shutdown) {
            console.log('run');

            let roll = await this.api.request_roll(0, 49.5, false);
            if (roll !== null) {
                console.log(roll.wager, roll.roll);
            } else {
                console.log('bet_error');
                await sleep(1000);
            }

            await sleep(1000);
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

class MyBot extends bot.Bot {
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

let mybot = new MyBot();
mybot.run(options.site, options.profile);
