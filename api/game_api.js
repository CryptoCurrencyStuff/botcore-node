let game = exports;

game.api = class GameAPI {
    constructor(config) {
        this.config = config;
    }

    async authenticate() {
        console.error('You must implement authenticate');
        process.exit(0);
    }

    async request_roll(wager, target, condition_high) {
        console.error('You must implement request_roll');
        process.exit(0);
    }
}
