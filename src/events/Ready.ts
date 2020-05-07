import Event from "../structures/Event";
import ACMClient from "../structures/Bot";

export default class ReadyEvent extends Event {
    
    constructor(client: ACMClient) {
        super(client, 'ready');
    }
    
    public async emit(client: ACMClient) {
        console.log('=================== READY START ===================');
        if(client.user) {
            client.logger.info(`Logged in as ${client.user.username}!`);
            var invite = await client.generateInvite(["ADMINISTRATOR"]);
            client.logger.info(invite);
            await client.user.setActivity('people get rona', {type: 'WATCHING'})
            client.logger.info(`Set activity to \"${process.env.ACTIVITY_TYPE} ${process.env.ACTIVITY_DESCRIPTION}\"`);
        }
        console.log('==================== READY END ====================');
    } 
}