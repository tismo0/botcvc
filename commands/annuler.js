import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { cancelLobbySchedules } from "../scheduler.js";

export const data = new SlashCommandBuilder()
  .setName("annuler")
  .setDescription("Annule toutes les programmations pour un lobby")
  .addStringOption(option =>
    option
      .setName("lobby")
      .setDescription("Choisir le salon dont annuler les programmations")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "vocal1" },
        { name: "Lobby 2", value: "vocal2" },
        { name: "Lobby 3", value: "vocal3" }
      )
  );

export async function execute(interaction, client) {
  const member = interaction.member;
  const salonCommandId = config.channels.annonceCommand;

  // 🔒 Vérif salon autorisé
  if (interaction.channelId !== salonCommandId) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié aux commandes.",
      ephemeral: true,
    });
  }

  // 🔒 Vérif rôles autorisés
  const hasPermission = config.roles.cvcRoles.some(roleId =>
    member.roles.cache.has(roleId)
  );
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  const lobbyKey = interaction.options.getString("lobby");
  const salonId = config.channels[lobbyKey];
  if (!salonId) {
    return interaction.reply({
      content: "❌ Lobby invalide.",
      ephemeral: true,
    });
  }

  // ❌ Annulation des tâches pour ce lobby
  const count = cancelLobbySchedules(salonId);

  if (count === 0) {
    return interaction.reply({
      content: `⚠️ Aucune programmation trouvée pour **${lobbyKey}**.`,
      ephemeral: false,
    });
  }

  return interaction.reply({
    content: `🛑 Toutes les programmations (${count}) pour **${lobbyKey}** ont été annulées avec succès.`,
    ephemeral: false,
  });
}
