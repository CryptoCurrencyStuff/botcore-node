"use strict"

const request = require('request-promise-native');
let Request = exports;

Request.Request = class Request {
    constructor() {
    }

    async get(uri, json = false) {
       const options = {
            method: 'GET',
            json: json,
            uri: uri
        };

        try {
            const response = await request(options);
            return response;
        } catch (error) {
            console.log('error ' + error);
        }

        return null;
    }

    async post(uri, form, headers, json = false) {
       const options = {
            method: 'POST',
            json: json,
            uri: uri,
            form: form,
            headers: headers
        };

        try {
            const response = await request(options);
            return response;
        } catch (error) {
            console.log('error ' + error);
        }

        return null;
    }
}
