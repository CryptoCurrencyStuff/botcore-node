let request = require('request-promise')

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

        //console.log(options);

        try {
            const response = await request(options);
            //console.log('query ' + response);
            return response;
        } catch (error) {
            console.log('error ' + error);
        }

        return false;
    }

    async post(uri, form, headers, json = false) {
       const options = {
            method: 'POST',
            json: json,
            uri: uri,
            form: form,
            headers: headers
        };

        //console.log(options);

        try {
            const response = await request(options);
            //console.log('query ' + response);
            return response;
        } catch (error) {
            console.log('error ' + error);
        }

        return false;
    }
}
