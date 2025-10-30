import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { scheduleVocalOpen } from "../scheduler.js";
import moment from "moment-timezone";

export const data = new SlashCommandBuilder()
  .setName("open")
  .setDescription("Planifie l'ouverture des salons vocaux pour chaque rôle")
  .addStringOption(option =>
    option.setName("salon")
      .setDescription("Choisir le salon vocal à ouvrir")
      .setRequired(true)
      .addChoices(
        { name: "Lobby 1", value: "vocal1" },
        { name: "Lobby 2", value: "vocal2" },
        { name: "Lobby 3", value: "vocal3" }
      )
  )
  .addStringOption(option => option.setName("heure_contrib").setDescription("Heure pour Contributeurs (ex: 20:30)").setRequired(true))
  .addStringOption(option => option.setName("heure_booster").setDescription("Heure pour Boosters (ex: 20:45)").setRequired(true))
  .addStringOption(option => option.setName("heure_soutien").setDescription("Heure pour Soutiens (ex: 21:00)").setRequired(true))
  .addStringOption(option => option.setName("heure_joueur").setDescription("Heure pour Joueurs (ex: 21:15)").setRequired(true));

export async function execute(interaction, client) {
  // ❌ Vérification du salon
  if (interaction.channelId !== config.channels.annonceCommand) {
    return interaction.reply({
      content: `❌ Cette commande ne peut être utilisée que dans <#${config.channels.annonceCommand}>.`,
      ephemeral: true
    });
  }

  // ❌ Vérification des rôles
  const hasPermission = config.roles.cvcRoles.some(roleId => interaction.member.roles.cache.has(roleId));
  if (!hasPermission) {
    return interaction.reply({
      content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
      ephemeral: true,
    });
  }

  // Récupération des options
  const salonKey = interaction.options.getString("salon");
  const heureContrib = interaction.options.getString("heure_contrib");
  const heureBooster = interaction.options.getString("heure_booster");
  const heureSoutien = interaction.options.getString("heure_soutien");
  const heureJoueur = interaction.options.getString("heure_joueur");

  const guild = await client.guilds.fetch(config.guildId);
  const salonVocal = await guild.channels.fetch(config.channels[salonKey]);
  if (!salonVocal) return interaction.reply({ content: "❌ Salon vocal introuvable.", ephemeral: true });

  // Fermer pour tout le monde d’abord
  await salonVocal.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });

  // Convertit "HH:mm" en Date exacte pour Bruxelles
  const getTime = (str) => {
    const [h, m] = str.split(":").map(Number);
    const brusselsTime = moment.tz({ hour: h, minute: m, second: 0, millisecond: 0 }, "Europe/Brussels");
    return brusselsTime.toDate();
  };

  // Planifier chaque ouverture
  await scheduleVocalOpen(guild, salonVocal, config.roles.contrib, getTime(heureContrib), client, config.channels.cvcTarget);
  await scheduleVocalOpen(guild, salonVocal, config.roles.booster, getTime(heureBooster), client, config.channels.cvcTarget);
  await scheduleVocalOpen(guild, salonVocal, config.roles.soutien, getTime(heureSoutien), client, config.channels.cvcTarget);
  await scheduleVocalOpen(guild, salonVocal, config.roles.joueur, getTime(heureJoueur), client, config.channels.cvcTarget);

  return interaction.reply({
    content: `✅ Le salon **${salonVocal.name}** va s'ouvrir progressivement :  
- Contributeurs → ${heureContrib}  

- Boosters → ${heureBooster}  
- Soutiens → ${heureSoutien}  

- Joueurs → ${heureJoueur}`,
    ephemeral: false
  });
}
