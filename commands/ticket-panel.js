import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } from "discord.js";
import config from "../config.json" with { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("ticket-panel")
  .setDescription("Crée ou met à jour LE panel de tickets (avec menu déroulant)");

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

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const panel = config.tickets.panel;

    // Créer l'embed du panel
    const embed = new EmbedBuilder()
      .setTitle(panel.embedTitle)
      .setDescription(panel.embedDescription)
      .setColor(panel.embedColor || "#5865F2")
      .setFooter({ text: "Utilise le menu déroulant pour choisir un type de ticket" })
      .setTimestamp();

    if (panel.embedThumbnail) {
      embed.setThumbnail(panel.embedThumbnail);
    }

    if (panel.embedImage) {
      embed.setImage(panel.embedImage);
    }

    // Créer le menu déroulant avec TOUS les types
    const options = [];

    for (const [typeKey, typeConfig] of Object.entries(config.tickets.types)) {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(typeConfig.label)
        .setValue(`ticket_${typeKey}`)
        .setDescription(`Créer un ticket de type: ${typeConfig.label}`);

      if (typeConfig.emoji) {
        option.setEmoji(typeConfig.emoji);
      }

      options.push(option);
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select_menu")
      .setPlaceholder("🎫 Sélectionne un type de ticket...")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Envoyer ou mettre à jour le panel
    const panelChannel = await client.channels.fetch(panel.channel);

    if (panel.messageId) {
      try {
        const existingMessage = await panelChannel.messages.fetch(panel.messageId);
        await existingMessage.edit({ embeds: [embed], components: [row] });
        
        await interaction.editReply({
          content: `✅ Panel de tickets mis à jour dans <#${panelChannel.id}>`
        });
      } catch (error) {
        // Message introuvable, créer un nouveau
        const message = await panelChannel.send({ embeds: [embed], components: [row] });
        
        await interaction.editReply({
          content: `✅ Nouveau panel de tickets créé dans <#${panelChannel.id}>\n\n⚠️ **Important:** Ajoute cet ID dans ton config.json:\n\`\`\`json\n"messageId": "${message.id}"\`\`\``
        });
      }
    } else {
      const message = await panelChannel.send({ embeds: [embed], components: [row] });
      
      await interaction.editReply({
        content: `✅ Panel de tickets créé dans <#${panelChannel.id}>\n\n⚠️ **Important:** Ajoute cet ID dans ton config.json (dans "panel"):\n\`\`\`json\n"messageId": "${message.id}"\`\`\``
      });
    }

  } catch (error) {
    console.error("Erreur lors de la création du panel:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de la création du panel."
    });
  }
}
