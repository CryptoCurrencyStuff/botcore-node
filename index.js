"use strict"

const Args = require('command-line-args')
const Bot = require('./bot/bot')

const opts = [
    { name: 'site', alias: 's', type: String },
    { name: 'profile', alias: 'p', type: String }
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
