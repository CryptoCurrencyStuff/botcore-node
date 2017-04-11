const fs = require('fs-promise');

const Profile = exports;

Profile.Profile = class {
    constructor() {
    }

    async load_profile(site, account) {
        console.log('load_profile');

        let data = await fs.readFile('./data/profiles.json');
        let profiles = JSON.parse(data);

        for (let profile of profiles.profiles) {
            if (profile.site.toLowerCase() === site.toLowerCase() &&
                    profile.username.toLowerCase() === account.toLowerCase()) {
                console.log(profile);
                return profile;
            }
        }

        return null;
    }
}
