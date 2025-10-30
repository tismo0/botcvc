import { SlashCommandBuilder, MessageFlags } from "discord.js";
import config from "../config.json" with { type: "json" };
import { removeUserFromTicket } from "../ticketSystem.js";

export const data = new SlashCommandBuilder()
  .setName("ticket-remove")
  .setDescription("Retire un utilisateur du ticket (staff uniquement)")
  .addUserOption(option =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à retirer")
      .setRequired(true)
  );

export async function execute(interaction, client) {
  // Vérifier les permissions (staff uniquement)
  const hasPermission = config.roles.cvcRoles.some(roleId =>
    interaction.member.roles.cache.has(roleId)
  );

  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n'as pas la permission d'utiliser cette commande.",
      flags: MessageFlags.Ephemeral
    });
  }

  const user = interaction.options.getUser("utilisateur");
  await removeUserFromTicket(interaction, user);
}
