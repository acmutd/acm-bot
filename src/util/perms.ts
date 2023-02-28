import { settings } from "./../settings";
import { PermissionFlagsBits } from "discord.js";

const ENV = "DEV";

const devPerms = {
  admin: PermissionFlagsBits.Administrator,
  circle:
    PermissionFlagsBits.ManageRoles |
    PermissionFlagsBits.ManageChannels |
    PermissionFlagsBits.ManageMessages,
};

const prodPerms = {
  admin: PermissionFlagsBits.Administrator,
  circle: BigInt("809997439796117544"),
};

export const perms = ENV === "DEV" ? devPerms : prodPerms;
