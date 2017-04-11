const fs = require('fs-promise');

const Profile = exports;

Profile.Profile = class {
    constructor(data_dir) {
        this.data_dir = data_dir;
    }

    async load_profile(site, account) {
        console.log('load_profile');

        let data = null;

        try {
            data = await fs.readFile(this.data_dir + '/profiles.json');
        } catch (e) {
            console.log(e);
            return null;
        }

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
