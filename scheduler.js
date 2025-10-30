import schedule from "node-schedule";

// 🧠 Stocke toutes les tâches planifiées, classées par salon vocal
export const scheduledVocalJobs = {};

/**
 * Planifie une ouverture de salon vocal pour un rôle donné.
 */
export async function scheduleVocalOpen(guild, salonVocal, roleId, date, client, messageChannelId) {
  const jobName = `${salonVocal.id}_${roleId}`;
  console.log(`⏰ Ouverture programmée pour le rôle ${roleId} à ${date.toLocaleTimeString()} (${jobName})`);

  const job = schedule.scheduleJob(jobName, date, async () => {
    try {
      const role = await guild.roles.fetch(roleId);
      if (!role) return console.error(`❌ Rôle introuvable : ${roleId}`);

      await salonVocal.permissionOverwrites.edit(roleId, {
        Connect: true,
        Speak: false,
        Stream: false,
        UseSoundboard: false,
        UseVAD: false
      });

      console.log(`✅ Salon ${salonVocal.name} ouvert pour ${role.name}`);

      const channel = await client.channels.fetch(messageChannelId);
      if (channel) {
        channel.send(` Le salon **${salonVocal.name}** est maintenant ouvert pour **${role.name}** !`);
      }
    } catch (err) {
      console.error("Erreur lors de l'ouverture du salon :", err);
    } finally {
      // Supprime la tâche une fois exécutée
      delete scheduledVocalJobs[jobName];
    }
  });

  // Stocke la tâche dans le tableau correspondant au salon
  if (!scheduledVocalJobs[salonVocal.id]) {
    scheduledVocalJobs[salonVocal.id] = [];
  }
  scheduledVocalJobs[salonVocal.id].push(job);

  return job;
}

/**
 * Annule toutes les programmations d’un salon vocal donné.
 * @param {string} salonId - L’ID du salon vocal.
 * @returns {number} - Le nombre de tâches annulées.
 */
export function cancelLobbySchedules(salonId) {
  const jobs = scheduledVocalJobs[salonId];
  if (!jobs || jobs.length === 0) return 0;

  let count = 0;
  for (const job of jobs) {
    job.cancel();
    count++;
  }

  delete scheduledVocalJobs[salonId];
  console.log(`🛑 ${count} tâche(s) annulée(s) pour le salon ${salonId}`);
  return count;
}
