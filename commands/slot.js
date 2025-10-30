// commands/slot.js
import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("slot")
  .setDescription("Changer le nombre de slots d'un salon vocal")
  .addStringOption(o =>
    o.setName("vocal")
      .setDescription("Choisir le salon vocal")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "vocal1" },
        { name: "Lobby 2", value: "vocal2" },
        { name: "Lobby 3", value: "vocal3" }
      ))
  .addIntegerOption(o =>
    o.setName("slots")
      .setDescription("Nombre de slots à définir (0 = illimité)")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(99));

export async function execute(interaction, client) {
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié aux commandes.",
      ephemeral: true,
    });
  }
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({ content: "❌ Commande à utiliser dans le salon de commandes uniquement.", ephemeral: true });
  }

  // 🔒 Vérifie si l'utilisateur a un rôle CVC
  const hasPermission = config.roles.cvcRoles.some(roleId => interaction.member.roles.cache.has(roleId));
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  // ...reste du code pour lock

  const vocalKey = interaction.options.getString("vocal");
  const slots = interaction.options.getInteger("slots");
  const vocalId = config.channels[vocalKey];

  const channel = await client.channels.fetch(vocalId);
  if (!channel || channel.type !== 2) return interaction.reply({
    content: "❌ Salon vocal invalide.",
    ephemeral: true
  });

  await channel.edit({ userLimit: slots });

  await interaction.reply({
    content: `✅ Le nombre de slots pour **${channel.name}** a été défini à ${slots === 0 ? "illimité" : slots}.`,
    ephemeral: false
  });
}
