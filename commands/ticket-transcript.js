import { SlashCommandBuilder, MessageFlags } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendTranscriptToOwner } from "../ticketSystem.js";

export const data = new SlashCommandBuilder()
  .setName("transcript")
  .setDescription("Envoie la transcription du ticket au membre en privé (staff uniquement)");

export async function execute(interaction) {
  const isStaff = config.roles.cvcRoles.some((roleId) =>
    interaction.member.roles.cache.has(roleId)
  );

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Tu n'as pas la permission d'utiliser cette commande.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const channel = interaction.channel;

  if (!channel?.name?.startsWith("ticket-")) {
    return interaction.reply({
      content: "❌ Cette commande doit être utilisée dans un salon de ticket.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply();

  try {
    const result = await sendTranscriptToOwner(channel);

    if (result?.success) {
      await interaction.editReply({
        content: `✅ Transcription envoyée en privé à <@${result.ownerId}>.`,
      });
    } else {
      const reason = result?.reason || "Impossible de trouver le propriétaire du ticket.";
      await interaction.editReply({
        content: `❌ ${reason}`,
      });
    }
  } catch (error) {
    console.error("Erreur /transcript:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de l'envoi de la transcription.",
    });
  }
}
