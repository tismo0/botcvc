import { 
  PermissionFlagsBits, 
  ChannelType, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder 
} from "discord.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Crée un nouveau ticket pour un utilisateur
 */
export async function createTicket(interaction, config, typeKey) {
  // ⚡ IMPORTANT : Répondre IMMÉDIATEMENT pour éviter le timeout de 3 secondes
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild = interaction.guild;
  const member = interaction.member;
  const ticketType = config.tickets.types[typeKey];

  if (!ticketType) {
    return interaction.editReply({
      content: "❌ Type de ticket introuvable."
    });
  }

  // Vérifier si l'utilisateur a déjà un ticket ouvert dans cette catégorie
  const existingTicket = guild.channels.cache.find(
    ch => ch.name === `ticket-${member.user.username.toLowerCase()}` && 
    ch.parentId === ticketType.categoryId
  );

  if (existingTicket) {
    return interaction.editReply({
      content: `❌ Tu as déjà un ticket ouvert: <#${existingTicket.id}>`
    });
  }

  try {
    // Créer le salon de ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: ticketType.categoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        // Permissions pour les staffs
        ...ticketType.mentionRoles.map(roleId => ({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }))
      ]
    });

    // Mentions des rôles staff
    const roleMentions = ticketType.mentionRoles.map(roleId => `<@&${roleId}>`).join(" ");

    // Embed de bienvenue
    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.tickets.panel.embedColor || "#5865F2")
      .setTitle(`🎫 ${ticketType.label}`)
      .setDescription(
        `Bienvenue ${member} !\n\n` +
        `${roleMentions} Un membre du staff te répondra bientôt.\n\n` +
        `**Type de ticket:** ${ticketType.label}\n` +
        `**Créé le:** <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: "Utilise les boutons ci-dessous pour gérer ce ticket" })
      .setTimestamp();

    // Boutons de gestion
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Fermer le ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_close_request")
        .setLabel("Demander la fermeture")
        .setEmoji("📩")
        .setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({
      content: roleMentions,
      embeds: [welcomeEmbed],
      components: [row]
    });

    // Log de création
    const logChannel = await guild.channels.fetch(ticketType.logChannel);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("🎫 Nouveau Ticket Créé")
        .addFields(
          { name: "Utilisateur", value: `${member} (${member.id})`, inline: true },
          { name: "Type", value: ticketType.label, inline: true },
          { name: "Salon", value: `<#${ticketChannel.id}>`, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }

    await interaction.editReply({
      content: `✅ Ton ticket a été créé: <#${ticketChannel.id}>`
    });

    await refreshTicketPanel(interaction, config);

  } catch (error) {
    console.error("Erreur lors de la création du ticket:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de la création du ticket."
    });
  }
}

function buildTicketSelectRow(config) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select_menu")
    .setPlaceholder("🎫 Sélectionne un type de ticket...");

  const options = Object.entries(config.tickets.types).map(([typeKey, typeConfig]) => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(typeConfig.label)
      .setValue(`ticket_${typeKey}`)
      .setDescription(`Créer un ticket de type: ${typeConfig.label}`);

    if (typeConfig.emoji) {
      option.setEmoji(typeConfig.emoji);
    }

    return option;
  });

  menu.addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

async function refreshTicketPanel(interaction, config) {
  if (!interaction.message) {
    return;
  }

  try {
    const row = buildTicketSelectRow(config);
    await interaction.message.edit({ components: [row] });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du menu de tickets:", error);
  }
}

/**
 * Ferme un ticket et génère la transcription HTML
 */
export async function closeTicket(interaction, config, isRequest = false) {
  const channel = interaction.channel;
  const guild = interaction.guild;

  if (!channel.name.startsWith("ticket-")) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un ticket.",
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.reply({
    content: "🔒 Fermeture du ticket en cours... Génération de la transcription..."
  });

  try {
    const transcript = await generateTranscript(channel, guild);

    const transcriptsDir = join(__dirname, 'transcripts');
    await fs.mkdir(transcriptsDir, { recursive: true });

    const transcriptFilename = `transcript-${channel.name}-${Date.now()}.html`;
    const transcriptPath = join(transcriptsDir, transcriptFilename);

    await fs.writeFile(transcriptPath, transcript, 'utf-8');

    const webUrl = process.env.WEB_URL || `http://localhost:${process.env.PORT || 3000}`;
    const transcriptUrl = `${webUrl}/transcript/${transcriptFilename}`;

    // Trouver le type de ticket selon la catégorie Discord
    let ticketType = Object.values(config.tickets.types).find(
      type => type.categoryId === channel.parentId
    );

    if (ticketType) {
      try {
        const logChannel = await guild.channels.fetch(ticketType.logChannel);

        // Vérifier que le channel existe et est textuel
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🔒 Ticket Fermé")
            .addFields(
              { name: "Salon", value: channel.name, inline: true },
              { name: "Fermé par", value: `${interaction.user}`, inline: true },
              { name: "Type", value: ticketType.label, inline: true },
              { name: "Lien de la transcription", value: `[Voir la transcription](http://51.83.6.5:20248/)` }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        } else {
          console.warn("Le salon de log n'est pas textuel ou introuvable :", ticketType.logChannel);
        }
      } catch (err) {
        console.error("Erreur envoi logChannel:", err);
      }
    } else {
      console.warn("Aucun type de ticket correspondant à la catégorie :", channel.parentId);
    }

    // Supprimer le salon après 5 secondes
    setTimeout(async () => {
      await channel.delete("Ticket fermé");
    }, 5000);

  } catch (error) {
    console.error("Erreur lors de la fermeture du ticket:", error);
    await interaction.followUp({
      content: "❌ Une erreur est survenue lors de la fermeture du ticket.",
      flags: MessageFlags.Ephemeral
    });
  }
}


/**
 * Génère une transcription HTML du ticket
 */
async function generateTranscript(channel, guild) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const sortedMessages = [...messages.values()].reverse();

  let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcription - ${channel.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #36393f;
      color: #dcddde;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #2f3136;
      border-radius: 8px;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #202225;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #fff;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header p {
      color: #b9bbbe;
      font-size: 14px;
    }
    .message {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #202225;
    }
    .message:hover {
      background: #32353b;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .message-content {
      flex: 1;
    }
    .message-header {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
    .username {
      color: #fff;
      font-weight: 600;
      margin-right: 10px;
    }
    .timestamp {
      color: #72767d;
      font-size: 12px;
    }
    .message-text {
      color: #dcddde;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .embed {
      background: #2f3136;
      border-left: 4px solid #5865f2;
      border-radius: 4px;
      padding: 10px;
      margin-top: 5px;
      max-width: 520px;
    }
    .embed-title {
      color: #fff;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .embed-description {
      color: #dcddde;
      font-size: 14px;
    }
    .attachment {
      margin-top: 10px;
    }
    .attachment img {
      max-width: 400px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Transcription du Ticket</h1>
      <p><strong>Salon:</strong> #${channel.name}</p>
      <p><strong>Catégorie:</strong> ${channel.parent?.name || "Aucune"}</p>
      <p><strong>Serveur:</strong> ${guild.name}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
      <p><strong>Nombre de messages:</strong> ${sortedMessages.length}</p>
    </div>
    <div class="messages">
`;

  for (const msg of sortedMessages) {
    const timestamp = new Date(msg.createdTimestamp).toLocaleString("fr-FR");
    const avatarURL = msg.author.displayAvatarURL();

    html += `
      <div class="message">
        <img class="avatar" src="${avatarURL}" alt="${msg.author.username}">
        <div class="message-content">
          <div class="message-header">
            <span class="username">${msg.author.username}</span>
            <span class="timestamp">${timestamp}</span>
          </div>
          <div class="message-text">${escapeHtml(msg.content)}</div>
    `;

    // Embeds
    if (msg.embeds.length > 0) {
      for (const embed of msg.embeds) {
        html += `
          <div class="embed">
            ${embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : ""}
            ${embed.description ? `<div class="embed-description">${escapeHtml(embed.description)}</div>` : ""}
          </div>
        `;
      }
    }

    // Attachments
    if (msg.attachments.size > 0) {
      for (const attachment of msg.attachments.values()) {
        if (attachment.contentType?.startsWith("image/")) {
          html += `
            <div class="attachment">
              <img src="${attachment.url}" alt="Image">
            </div>
          `;
        } else {
          html += `
            <div class="attachment">
              <a href="${attachment.url}" target="_blank">📎 ${attachment.name}</a>
            </div>
          `;
        }
      }
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Ajoute un utilisateur à un ticket
 */
export async function addUserToTicket(interaction, user) {
  const channel = interaction.channel;

  if (!channel.name.startsWith("ticket-")) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un ticket.",
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    await channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await interaction.reply({
      content: `✅ ${user} a été ajouté au ticket.`
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur:", error);
    await interaction.reply({
      content: "❌ Impossible d'ajouter cet utilisateur au ticket.",
      flags: MessageFlags.Ephemeral
    });
  }
}

/**
 * Retire un utilisateur d'un ticket
 */
export async function removeUserFromTicket(interaction, user) {
  const channel = interaction.channel;

  if (!channel.name.startsWith("ticket-")) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un ticket.",
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    await channel.permissionOverwrites.delete(user);

    await interaction.reply({
      content: `✅ ${user} a été retiré du ticket.`
    });
  } catch (error) {
    console.error("Erreur lors du retrait de l'utilisateur:", error);
    await interaction.reply({
      content: "❌ Impossible de retirer cet utilisateur du ticket.",
      flags: MessageFlags.Ephemeral
    });
  }
}
