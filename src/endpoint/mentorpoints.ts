import { Express, Request, Response } from "express";
import Bot from "../api/bot";

/* Endpoints that handle external functionality related to the points system */

module.exports = (app: Express, bot: Bot) => {
  // Activities form endpoint for typeform
  app.post("/points-form", async (req: Request, res: Response) => {
    res.status(200).end();
    await bot.managers.points.handlePointsTypeform(req.body).catch((e) => {
      bot.logger.error(`Call to /points-form was unable to be handled: ${e}`);
    });
  });

  // Registration form endpoint for typeform to hit
  app.post("/registration-form", async (req: Request, res: Response) => {
    res.status(200).end();
    await bot.managers.points
      .handleRegistrationTypeform(req.body)
      .catch((e) => {
        bot.logger.error(
          `Call to /registration-form was unable to be handled: ${e}`
        );
      });
  });

  // any point end point for typeform to hit. It just needs to arrive with a score and the email as q1.
  app.post("/generic-form", async (req: Request, res: Response) => {
    res.status(200).end();
    await bot.managers.points.handleGenericTypeform(req.body).catch((e) => {
      bot.logger.error(`Call to /generic-form was unable to be handled: ${e}`);
    });
  });
};
