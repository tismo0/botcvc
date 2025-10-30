import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("annonce")
  .setDescription("Créer une annonce (réservé aux modérateurs)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  // Titre principal obligatoire
  .addStringOption(option =>
    option.setName("titre")
      .setDescription("Titre principal de l'annonce")
      .setRequired(true)
  )
  // 1er sous-titre et description (facultatifs)
  .addStringOption(option =>
    option.setName("sous_titre1")
      .setDescription("Premier sous-titre")
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName("description1")
      .setDescription("Texte du premier sous-titre")
      .setRequired(false)
  )
  // 2ème sous-titre et description facultatifs
  .addStringOption(option =>
    option.setName("sous_titre2")
      .setDescription("Deuxième sous-titre (facultatif)")
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName("description2")
      .setDescription("Texte du deuxième sous-titre")
      .setRequired(false)
  )
  // 3ème sous-titre et description facultatifs
  .addStringOption(option =>
    option.setName("sous_titre3")
      .setDescription("Troisième sous-titre (facultatif)")
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName("description3")
      .setDescription("Texte du troisième sous-titre")
      .setRequired(false)
  );

export async function execute(interaction, client) {
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié.",
      ephemeral: true
    });
  }

  // Vérifie si le membre a au moins un des rôles autorisés
  const hasPermission = config.roles.annonceRoles.some(roleId =>
    interaction.member.roles.cache.has(roleId)
  );

  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n'as pas la permission d'utiliser cette commande.",
      ephemeral: true
    });
  }

  // Récupération des options
  const titre = interaction.options.getString("titre");
  const st1 = interaction.options.getString("sous_titre1");
  const desc1 = interaction.options.getString("description1");
  const st2 = interaction.options.getString("sous_titre2");
  const desc2 = interaction.options.getString("description2");
  const st3 = interaction.options.getString("sous_titre3");
  const desc3 = interaction.options.getString("description3");

  // Création de l'embed
  let embedDescription = "";
  if (st1 || desc1) embedDescription += `${st1 ? `**${st1}**\n` : ""}${desc1 ?? ""}\n\n`;
  if (st2 || desc2) embedDescription += `${st2 ? `**${st2}**\n` : ""}${desc2 ?? ""}\n\n`;
  if (st3 || desc3) embedDescription += `${st3 ? `**${st3}**\n` : ""}${desc3 ?? ""}\n\n`;

  const embed = new EmbedBuilder()
    .setTitle(`📢 Annonce - ${titre}`)
    .setDescription(embedDescription)
    .setImage(config.annonceGif)
    .setThumbnail("https://cdn.discordapp.com/attachments/1251611248450343075/1427724240404349020/Projet_Redimensionner_une_image.png?ex=69025c50&is=69010ad0&hm=ee969be71fa9b9e19fd99159ab42c9a8a12c9617ffbb0094701fb078c5dcadee&")
    .setColor("#ff00ff")
    .setTimestamp();

  // Envoi dans le salon cible
  const targetChannel = await client.channels.fetch(config.channels.annonceTarget);
  console.log(`🔔 [ANNONCE] Envoi de l'embed pour "${titre}"`);
  await targetChannel.send({ embeds: [embed] });
  console.log(`✅ [ANNONCE] Embed envoyé avec succès`);

  // Réponse éphémère au modérateur
  await interaction.reply({
    content: "✅ Annonce envoyée avec succès !",
    flags: MessageFlags.Ephemeral
  });
}
