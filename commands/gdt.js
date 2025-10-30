import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("gdt")
  .setDescription("Créer une annonce GDT (réservé aux rôles CVC)")
  .addStringOption(o =>
    o.setName("objectif")
      .setDescription("Objectif de points")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("heure")
      .setDescription("Heure du GDT")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("lobby")
      .setDescription("Choisir le lobby")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "**Lobby 1**" },
        { name: "Lobby 2", value: "**Lobby 2**" },
        { name: "Lobby 3", value: "**Lobby 3**" }
      ))
  .addStringOption(o =>
    o.setName("salon_vocal")
      .setDescription("Choisir le salon vocal")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "**Lobby 1**" },
        { name: "Lobby 2", value: "**Lobby 2**" },
        { name: "Lobby 3", value: "**Lobby 3**" }
      ))
  .addUserOption(o =>
    o.setName("co_organisateur")
      .setDescription("Co-organisateur (facultatif)")
      .setRequired(false));

export async function execute(interaction, client) {
  // Vérif salon commande
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié.",
      ephemeral: true,
    });
  }

  // Vérif rôles
  const hasPermission = config.roles.cvcRoles.some(roleId =>
    interaction.member.roles.cache.has(roleId)
  );
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  // Récupération des options
  const objectif = interaction.options.getString("objectif");
  const heure = interaction.options.getString("heure");
  const lobby = interaction.options.getString("lobby");
  const salonVocal = interaction.options.getString("salon_vocal");
  const organizer = interaction.user;
  const coOrganizer = interaction.options.getUser("co_organisateur");

  // Définir les équipes fixes
  const equipe1 = "**🔵 Équipe Bleue**";
  const equipe2 = "**🔴 Équipe Rouge**";

  // Création embed
  const embed = new EmbedBuilder()
    .setColor("#6c0277")
    .setThumbnail("https://cdn.discordapp.com/attachments/1251611248450343075/1427724240404349020/Projet_Redimensionner_une_image.png?ex=69025c50&is=69010ad0&hm=ee969be71fa9b9e19fd99159ab42c9a8a12c9617ffbb0094701fb078c5dcadee&")
    .setImage("https://cdn.discordapp.com/attachments/1251611248450343075/1430624900229369906/Copie_de_Convoi_3.png?ex=69025dc3&is=69010c43&hm=6e42a2ea5528abe0648c6adf2aaf2d96b108e886fc6598f7f127510cb6525e9d&")
    .setDescription(
      `# Mode de Jeu: GDT
**Organisé par :** ${organizer} 
${coOrganizer ? `**Co-organisé par :** ${coOrganizer}\n` : ""} 
**Objectif de points : ${objectif}**
**Heure du GDT : ${heure}**

*Deux équipes spawnent à deux endroits différents sur un terrain. Ils doivent se trouver et s'affronter en éliminant un maximum d'adversaires pour atteindre le score maximum* **(${objectif})**`
    )
    .addFields(
      { name: "Lobby", value: lobby, inline: true },
      { name: "Salon vocal à rejoindre", value: salonVocal, inline: true },
      { name: "Équipe 1", value: equipe1, inline: true },
      { name: "Équipe 2", value: equipe2, inline: true }
    )
    .setFooter({ text: "Réagissez pour participer" })
    .setTimestamp();

  const targetChannel = await client.channels.fetch(config.channels.cvcTarget);
  const message = await targetChannel.send({
    content: "@everyone",
    embeds: [embed],
    allowedMentions: { parse: ["everyone"] }
  });

  await message.react("✅");

  await interaction.reply({
    content: "✅ Annonce GDT envoyée avec succès !",
    ephemeral: false,
  });
}
