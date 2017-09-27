"use strict"

const fs = require('fs-promise');

const Profile = exports;

Profile.Profile = class {
    constructor(data_dir) {
        this.data_dir = data_dir;
        this.profile_path = data_dir + '/profiles.json';
    }

    async load_profiles() {
        let data = null;

        try {
            data = await fs.readFile(this.profile_path);
        } catch (e) {
            console.log(e);
        }

        return data;
    }

    async load_profile(site, account) {
        console.log('load_profile');

        let data = await this.load_profiles();
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

    async store_profile(site, account, profile) {
        let profiles = await this.load_profiles();
        if (profiles === null) {
            return false;
        }

        let profiles_obj = null;
        try {
            profiles_obj = JSON.parse(profiles);
        } catch (e) {
            console.log(e);
            return false;
        }

        try {
            let result = await fs.writeFile(this.profile_path, profiles);
        } catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }
}
