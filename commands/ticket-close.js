import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { closeTicket } from "../ticketSystem.js";

export const data = new SlashCommandBuilder()
  .setName("ticket-close")
  .setDescription("Ferme le ticket actuel (staff uniquement)");

export async function execute(interaction, client) {
  await closeTicket(interaction, config, false);
}
