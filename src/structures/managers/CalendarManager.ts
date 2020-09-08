import ACMClient from '../Bot';

export default class CalendarManager {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }

    public async setup() {}
}
