import fs from 'fs';
import path from 'path';
import ACMClient from '../Bot';
import { settings } from '../../botsettings';
import {Firestore, Settings} from '@google-cloud/firestore';


export default class FirestoreManager {
    public client: ACMClient;
    
    public firestore: Firestore | undefined;
    

    constructor(client: ACMClient) {
        this.client = client;        
    }


    async setup() {
        this.firestore = new Firestore({
            projectId: settings.firestore.projectId,
            keyFilename: settings.firestore.keyFilename,
        });
    }
}
