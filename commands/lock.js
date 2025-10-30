import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("lock")
  .setDescription("Ferme complètement un salon vocal (personne ne peut le rejoindre)")
  .addStringOption(option =>
    option
      .setName("lobby")
      .setDescription("Choisir le salon vocal à verrouiller")
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

  // Vérification : salon autorisé
  if (interaction.channelId !== salonCommandId) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié aux commandes.",
      ephemeral: true,
    });
  }

  // Vérification : rôle autorisé
  const hasPermission = config.roles.cvcRoles.some(roleId =>
    member.roles.cache.has(roleId)
  );
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  // Récupération du salon
  const lobbyKey = interaction.options.getString("lobby");
  const salonId = config.channels[lobbyKey];
  const guild = await client.guilds.fetch(config.guildId);
  const salonVocal = await guild.channels.fetch(salonId);

  if (!salonVocal) {
    return interaction.reply({
      content: "❌ Salon vocal introuvable.",
      ephemeral: true,
    });
  }

  try {
    // 🔒 On verrouille complètement le salon (visible mais non connectable)
    await salonVocal.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: ["Connect"],
        allow: ["ViewChannel"],
      },
    ]);

    console.log(`🔒 Salon ${salonVocal.name} fermé pour tout le monde.`);

    return interaction.reply({
      content: `🔒 Le salon **${salonVocal.name}** a été fermé. Personne ne peut s'y connecter.`,
      ephemeral: false,
    });
  } catch (err) {
    console.error("Erreur lors du verrouillage :", err);
    return interaction.reply({
      content: "❌ Une erreur est survenue lors de la fermeture du salon.",
      ephemeral: false,
    });
  }
}
