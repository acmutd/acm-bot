import ACMClient from './Bot';

export default abstract class Event {
    public client: ACMClient;
    public name: string;

    constructor(client: ACMClient, event: string) {
        this.client = client;
        this.name = event;
    }

    public abstract async emit(...args: any[]): Promise<any>;
}
