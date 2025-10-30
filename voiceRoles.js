/**
 * Gestion automatique des rôles selon les salons vocaux
 */
export async function handleVoiceRole(oldState, newState, config) {
  const member = newState.member;
  const guild = member.guild;

  // Vérifie si l'utilisateur a rejoint un vocal
  if (newState.channelId) {
    if (newState.channelId === config.channels.vocal1) {
      await addRole(member, config.roles.vocal1, guild);
    }
    if (newState.channelId === config.channels.vocal2) {
      await addRole(member, config.roles.vocal2, guild);
    }
    if (newState.channelId === config.channels.vocal3) {
      await addRole(member, config.roles.vocal3, guild);
    }
  }

  // Vérifie si l'utilisateur a quitté un vocal
  if (oldState.channelId && !newState.channelId) {
    if (oldState.channelId === config.channels.vocal1) {
      await removeRole(member, config.roles.vocal1, guild);
    }
    if (oldState.channelId === config.channels.vocal2) {
      await removeRole(member, config.roles.vocal2, guild);
    }
    if (oldState.channelId === config.channels.vocal3) {
      await removeRole(member, config.roles.vocal3, guild);
    }
  }
}

// --- Fonctions utilitaires ---
async function addRole(member, roleId, guild) {
  const role = guild.roles.cache.get(roleId);
  if (role && !member.roles.cache.has(roleId)) {
    await member.roles.add(role);
    console.log(`✅ Rôle ${role.name} ajouté à ${member.user.tag}`);
  }
}

async function removeRole(member, roleId, guild) {
  const role = guild.roles.cache.get(roleId);
  if (role && member.roles.cache.has(roleId)) {
    await member.roles.remove(role);
    console.log(`❌ Rôle ${role.name} retiré de ${member.user.tag}`);
  }
}