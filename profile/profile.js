"use strict"

const fs = require('fs-extra');

const Profile = exports;

Profile.Profile = class {
    constructor(data_dir) {
        this.data_dir = data_dir;
        this.profile_path = data_dir + '/profiles.json';
    }

    async load_profiles() {
        let data = null;
        let profiles_obj = null;

        try {
            data = await fs.readFile(this.profile_path);
        } catch (e) {
            console.log(e);
            return null;
        }

        try {
            profiles_obj = JSON.parse(data);
        } catch (e) {
            console.log(e);
            return null;
        }

        return profiles_obj;
    }

    async load_global_config() {
        console.log('config');

        let data = await this.load_profiles();
        if (data !== null)
            return data.config;
        return null;
    }

    async load_profile(site, account) {
        console.log('load_profile');

        let profiles = await this.load_profiles();

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
