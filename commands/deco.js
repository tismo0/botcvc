// commands/deco.js
import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("deco")
  .setDescription("Déconnecte toutes les personnes d’un salon vocal")
  .addStringOption(o =>
    o.setName("vocal")
      .setDescription("Choisir le vocal à vider")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "vocal1" },
        { name: "Lobby 2", value: "vocal2" },
        { name: "Lobby 3", value: "vocal3" }
      ));

export async function execute(interaction, client) {
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({ content: "❌ Commande à utiliser dans le salon dédié aux commandes uniquement.", ephemeral: true });
  }
  const hasPermission = config.roles.cvcRoles.some(roleId => interaction.member.roles.cache.has(roleId));
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }
  const vocalKey = interaction.options.getString("vocal");
  const vocalId = config.channels[vocalKey];
  const channel = await client.channels.fetch(vocalId);

  if (channel.members.size === 0) {
    return interaction.reply(`ℹ️ ${channel.name} est déjà vide.`);
  }

  for (const [_, member] of channel.members) {
    await member.voice.disconnect();
  }

  interaction.reply(`🚪 Tous les membres ont été déconnectés de ${channel.name}.`);
}
