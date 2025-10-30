import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("cvc")
  .setDescription("Créer une annonce CVC (réservé aux rôles autorisés)")
  .addStringOption(o =>
    o.setName("equipe1")
      .setDescription("Nom de l'équipe 1")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("equipe2")
      .setDescription("Nom de l'équipe 2")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("salon_vocal")
      .setDescription("Choisir le salon vocal")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "Lobby 1" },
        { name: "Lobby 2", value: "Lobby 2" },
        { name: "Lobby 3", value: "Lobby 3" }
      ))
  .addStringOption(o =>
    o.setName("session")
      .setDescription("Choisir la session")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "Lobby 1" },
        { name: "Lobby 2", value: "Lobby 2" },
        { name: "Lobby 3", value: "Lobby 3" }
      ))
  .addStringOption(o =>
    o.setName("heure_contributeur")
      .setDescription("Heure pour les contributeurs")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("heure_booster")
      .setDescription("Heure pour les boosters / soutiens")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("heure_joueur")
      .setDescription("Heure pour les joueurs normaux")
      .setRequired(true))
  .addStringOption(o =>
    o.setName("type")
      .setDescription("Type d'équipe (Gang, Mafia, Cartel, etc.)")
      .setRequired(true))
  .addUserOption(o =>
    o.setName("co_organisateur")
      .setDescription("Mentionner un co-organisateur (facultatif)")
      .setRequired(false))
  .addBooleanOption(o => o.setName("kevlar").setDescription("Kevlar disponible ?"))
  .addBooleanOption(o => o.setName("automatique").setDescription("Automatique activé ?"))
  .addBooleanOption(o => o.setName("redrop").setDescription("Redrop autorisé ?"));

export async function execute(interaction, client) {
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans le salon dédié.",
      ephemeral: true,
    });
  }

  const hasPermission = config.roles.cvcRoles.some(roleId => interaction.member.roles.cache.has(roleId));
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  // Récupération des options
  const equipe1 = interaction.options.getString("equipe1");
  const equipe2 = interaction.options.getString("equipe2");
  const salonVocal = interaction.options.getString("salon_vocal");
  const session = interaction.options.getString("session");
  const heureContrib = interaction.options.getString("heure_contributeur");
  const heureBooster = interaction.options.getString("heure_booster");
  const heureJoueur = interaction.options.getString("heure_joueur");
  const type = interaction.options.getString("type");
  const kevlar = interaction.options.getBoolean("kevlar") ?? false;
  const automatique = interaction.options.getBoolean("automatique") ?? false;
  const redrop = interaction.options.getBoolean("redrop") ?? false;
  const organizer = interaction.user;
  const coOrganizer = interaction.options.getUser("co_organisateur");

  // Embed complet
  const embed = new EmbedBuilder()
      .setColor("#6c0277")
      .setThumbnail("https://cdn.discordapp.com/attachments/1251611248450343075/1427724240404349020/Projet_Redimensionner_une_image.png?ex=69025c50&is=69010ad0&hm=ee969be71fa9b9e19fd99159ab42c9a8a12c9617ffbb0094701fb078c5dcadee&")
      .setImage("https://cdn.discordapp.com/attachments/1251611248450343075/1430608760812077116/Convoi_4.png?ex=69024ebc&is=6900fd3c&hm=266b17da53fbd9c6ba77a6bce66003e9cd36ac341b9814c8e98d7567e1ff4309&") // ajoute l'image que tu veux
      .setFooter({ text: "✅ Réagissez pour participer" })
      .setTimestamp()
      .setDescription(
  `# ⚔️ Mode de Jeu : CVC

  **Organisé par :** ${organizer}
  ${coOrganizer ? `**Co-organisé par :** ${coOrganizer}\n` : ""}  
  Équipe N°1 : **${equipe1}**
  Équipe N°2 : **${equipe2}**
  Salon Vocal : **${salonVocal}**
  Session : **${session}**

  ` // <- ligne vide pour espacer avant Contributeur
      )
      .addFields(
          // Ligne 1 : Contributeur / Booster / Joueurs
          { name: "Contributeur", value: `**${heureContrib}**`, inline: true },
          { name: "Booster & Soutien", value: `**${heureBooster}**`, inline: true },
          { name: "Joueurs", value: `**${heureJoueur}**`, inline: true },

          // Ligne 2 : Kevlar / Automatique / Redrop avec mini-case
          { name: "Kevlar", value: kevlar ? "`✅`" : "`❌`", inline: true },
          { name: "Automatique", value: automatique ? "`✅`" : "`❌`", inline: true },
          { name: "Redrop", value: redrop ? "`✅`" : "`❌`", inline: true },

          // Ligne finale : Type
          { name: "Type", value: `**${type}**`, inline: false }
      );


  const targetChannel = await client.channels.fetch(config.channels.cvcTarget);
  const message = await targetChannel.send({
    content: "@everyone",
    embeds: [embed],
    allowedMentions: { parse: ["everyone"] }
  });

  await message.react("✅");

  await interaction.reply({
    content: "✅ Annonce CVC envoyée avec succès ! Prochain CVC dispo dans 45 minutes ⏳",
    ephemeral: false,
  });
}
