# 🎫 Système de Tickets - Guide Complet

## 📋 Fonctionnalités

✅ **UN SEUL panel** avec menu déroulant pour choisir le type  
✅ **Menu personnalisable** (emojis, labels, descriptions)  
✅ **Création automatique** dans la bonne catégorie Discord selon le type  
✅ **Embed de bienvenue** avec mention des staffs  
✅ **Boutons de gestion** : fermer ou demander la fermeture  
✅ **Transcription HTML** automatique avec design Discord-like  
✅ **Logs séparés** par type de ticket dans différents salons  
✅ **Commandes staff** : ajouter/retirer des utilisateurs, fermer  
✅ **Design clean** : menu compact au lieu de multiples boutons  

---

## ⚙️ Configuration dans `config.json`

### 1. Créer les catégories Discord

Sur ton serveur Discord, crée les catégories où les tickets seront créés :
- Une catégorie "📩 TICKETS SUPPORT" (copie son ID)
- Une catégorie "⚔️ TICKETS CVC" (copie son ID)

### 2. Créer les salons

- **1 salon pour le panel** : `#créer-ticket` (tous les boutons seront ici)
- **1 salon de logs par type** : `#logs-support`, `#logs-cvc`, etc.

### 3. Structure de `config.json`

```json
"tickets": {
  "panel": {
    "channel": "ID_DU_CHANNEL_PANEL_TICKETS",    // ⬅️ Salon où afficher LE panel unique
    "messageId": null,                            // ⬅️ Laisse null au début
    "embedTitle": "🎫 Système de Tickets",
    "embedDescription": "Utilise le menu pour choisir ton type de ticket.",
    "embedColor": "#5865F2",                      // ⬅️ Couleur de l'embed
    "embedThumbnail": "https://...",              // ⬅️ Image en haut à droite (optionnel)
    "embedImage": "https://..."                   // ⬅️ Grande image en bas (optionnel)
  },
  "types": {
    "support": {                                  // ⬅️ ID du type (utilisé dans le menu)
      "label": "Support - Question",              // ⬅️ Texte affiché dans le menu
      "emoji": "❓",                               // ⬅️ Emoji dans le menu (optionnel)
      "categoryId": "ID_CATEGORIE_SUPPORT",       // ⬅️ Catégorie Discord où créer le ticket
      "logChannel": "ID_CHANNEL_LOG_SUPPORT",     // ⬅️ Salon de logs pour ce type
      "mentionRoles": ["ID_ROLE_STAFF"]           // ⬅️ Rôles staffs à mentionner
    },
    "contrib": {
      "label": "Contrib",
      "emoji": "💰",
      "categoryId": "ID_CATEGORIE_CONTRIB",
      "logChannel": "ID_CHANNEL_LOG_CONTRIB",
      "mentionRoles": ["ID_ROLE_STAFF"]
    }
  }
}
```

### 4. Menu déroulant

Le système utilise un **menu déroulant** (SelectMenu) au lieu de boutons :
- Plus **clean** et compact
- Supporte jusqu'à **25 options** (types de tickets)
- Affiche emojis + labels + descriptions automatiques

---

## 🚀 Utilisation

### Créer LE panel de tickets

```
/ticket-panel
```

Le bot va :
1. Créer l'embed avec un **menu déroulant** contenant tous les types dans le salon configuré (`panel.channel`)
2. Te donner un `messageId` à copier dans `config.json` sous `panel.messageId`

**Aperçu du panel :**
- Un embed stylé avec titre, description, image
- Un menu déroulant "🎫 Sélectionne un type de ticket..."
- Cliquer ouvre une liste avec tous les types disponibles (emoji + label)

### Commandes staff

```
/ticket-close              → Ferme le ticket actuel
/ticket-add utilisateur:@user   → Ajoute quelqu'un au ticket
/ticket-remove utilisateur:@user → Retire quelqu'un du ticket
```

### Boutons dans les tickets

- **🔒 Fermer le ticket** : Staff uniquement, ferme immédiatement
- **📩 Demander la fermeture** : Utilisateurs, envoie une demande aux staffs

---

## 📊 Transcription HTML

Quand un ticket est fermé, le bot génère automatiquement :
- Un fichier HTML avec tous les messages
- Design identique à Discord (avatars, timestamps, embeds, images)
- Envoyé dans le salon de logs configuré

---

## 🎨 Personnalisation avancée

### Ajouter un nouveau type de ticket

Dans `config.json`, ajoute un nouveau type dans `tickets.types` :

```json
"recrutement": {
  "label": "Candidature - Recrutement",
  "emoji": "📝",
  "categoryId": "ID_CATEGORIE_RECRUTEMENT",
  "logChannel": "ID_CHANNEL_LOG_RECRUTEMENT",
  "mentionRoles": ["ID_ROLE_RH", "ID_ROLE_STAFF"]
}
```

Relance `/ticket-panel` pour mettre à jour le menu avec la nouvelle option.

### Personnaliser l'embed du panel

Dans `config.json`, modifie `tickets.panel` :

```json
"panel": {
  "embedTitle": "🎫 Ton Titre Personnalisé",
  "embedDescription": "Ta description ici.\nSupporte les **sauts de ligne** et **markdown**.",
  "embedColor": "#FF5733",
  "embedThumbnail": "https://cdn.discordapp.com/...",  // Petite image en haut à droite
  "embedImage": "https://cdn.discordapp.com/..."       // Grande image en bas
}
```

### Logs différents par type

Chaque type peut avoir son propre salon de logs :

```json
"support_general": {
  "logChannel": "ID_LOGS_SUPPORT"
},
"cvc_bug": {
  "logChannel": "ID_LOGS_CVC"
}
```

### Staffs différents par type

```json
"support_general": {
  "mentionRoles": ["ID_ROLE_SUPPORT"]
},
"cvc_bug": {
  "mentionRoles": ["ID_ROLE_STAFF_CVC", "ID_ROLE_ADMIN"]
}
```

---

## 🔧 Déploiement sur Replit

1. **Créer un Repl** sur replit.com (Node.js)
2. **Uploader tous les fichiers** du projet
3. **Dans config.json** :
   - Remplace tous les `ID_...` par les vrais IDs Discord
   - **IMPORTANT** : Régénère ton token Discord (il est exposé en clair)
4. **Dans Secrets (🔒)** :
   - Ajoute `DISCORD_TOKEN` avec ton nouveau token
5. **Modifier index.js** (ligne 5) :
   ```js
   // Remplace cette ligne :
   import config from "./config.json" with { type: "json" };
   
   // Par :
   import fs from "fs/promises";
   const configData = JSON.parse(await fs.readFile("./config.json", "utf-8"));
   const config = { ...configData, token: process.env.DISCORD_TOKEN };
   ```
6. **Clique sur Run**

---

## 📝 Checklist avant de lancer

- [ ] Les catégories Discord sont créées (Support, CVC, etc.)
- [ ] Le salon du panel unique est créé (`panel.channel`)
- [ ] Les salons de logs sont créés (un par type de ticket)
- [ ] Tous les IDs dans `config.json` sont remplis :
  - `panel.channel` : Salon du panel
  - Pour chaque type : `categoryId` et `logChannel`
- [ ] Les rôles staffs sont corrects dans `mentionRoles` de chaque type
- [ ] Le bot a les permissions : **Gérer les salons**, **Lire/Envoyer messages**, **Gérer les messages**
- [ ] Les intents sont activés sur le portail Discord : **Server Members**, **Message Content**
- [ ] Le token est sécurisé (régénéré si exposé)

---

## ❓ Problèmes courants

### "Type de ticket introuvable"
→ Vérifie que l'ID du type existe bien dans `config.json` sous `tickets.types`

### "Permission denied"
→ Le bot doit avoir accès aux catégories Discord et les permissions **Gérer les salons**

### Le menu ne fonctionne pas
→ Le menu crée automatiquement les options avec `value = "ticket_" + typeKey`  
→ Exemple : le type `support` aura la valeur `ticket_support`  
→ Vérifie que `ticket_select_menu` est bien le customId du menu

### La transcription ne s'envoie pas
→ Vérifie que `logChannel` de chaque type existe et que le bot peut y écrire

### Le panel ne se met pas à jour
→ Après avoir modifié `config.json`, relance `/ticket-panel` pour recréer le panel

---

## 🎉 C'est prêt !

Ton système de tickets est maintenant opérationnel. Les utilisateurs peuvent créer des tickets, les staffs peuvent les gérer, et tout est automatiquement archivé en HTML.
