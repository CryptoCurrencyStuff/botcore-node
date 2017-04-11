const Args = require('command-line-args')
const Profile = require('./profile/profile')
const Bot = require('./bot/bot')

const opts = [
    { name: 'site', alias: 's', type: String },
    { name: 'profile', alias: 'p', type: String },
]

const options = Args(opts);
console.log(options);

if (typeof(options.site) !== 'string') {
    console.log('You must specify a site');
    process.exit(1);
}

if (typeof(options.profile) !== 'string') {
    console.log('You must specify a profile');
    process.exit(1);
}

let botcore = exports;
botcore.bot = Bot;
botcore.options = options;
botcore.data_dir = __dirname + '/data';

botcore.initialize_api = async function initialize_api(site, account) {
    let profiles = new Profile.Profile(botcore.data_dir);
    let profile = await profiles.load_profile(site, account);
    if (profile === null) {
        console.log('unable to load profile', account, 'on site', site);
        process.exit(1);
    }

    let lsite = site.toLowerCase();
    switch (lsite) {
        case "primedice": {
            return new botcore.bot.PrimeDice.API(profile);
        }

        //case "bitsler": { }
    }

    return null;
}
