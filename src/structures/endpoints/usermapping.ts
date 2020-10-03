import ACMClient from '../Bot';
import { Request, Response, Express } from "express";


module.exports = (app: Express, client: ACMClient) => {
    /**
     * Input: discord user#discrim
     * Output: discord userid
     *   1. Status code 418 if not found (I'm a teapot)
     *   2. Status code 200 
     */
    app.post('/mapdiscord', async (req: Request, res: Response) => {
        res.status(200).send(req.body);
    });
};
