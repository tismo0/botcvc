import { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
dotenv.config();

import { handleVoiceRole } from "./voiceRoles.js";
import { createTicket, closeTicket } from "./ticketSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Lire config.json sans "assert" pour compat Render ---
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// --- Configuration Express ---
const app = express();
const webPort = process.env.PORT || 20248;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Créer le dossier transcripts s’il n’existe pas
const transcriptsDir = path.join(__dirname, "transcripts");
fs.mkdirSync(transcriptsDir, { recursive: true });

// --- SUPPRESSION DE TRANSCRIPT ---
app.post("/delete-ticket", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).send("Nom de fichier manquant");

  const filePath = path.join(transcriptsDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Transcription supprimée: ${filename}`);
      res.redirect("/");
    } catch (err) {
      console.error("Erreur suppression:", err);
      res.status(500).send("Impossible de supprimer le transcript");
    }
  } else {
    res.status(404).send("Transcription non trouvée");
  }
});

// --- ROUTE DU DASHBOARD ---
app.get("/", async (req, res) => {
  try {
    const transcriptFiles = fs
      .readdirSync(transcriptsDir)
      .filter((file) => file.endsWith(".html"));

    const normalizeKey = (value) =>
      value
        ? value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        : "";

    const transcripts = await Promise.all(
      transcriptFiles.map(async (file) => {
        try {
          const content = await fs.promises.readFile(path.join(transcriptsDir, file), "utf-8");
          const titleMatch = content.match(/<title>Transcription - (.*?)<\/title>/);
          const dateMatch = content.match(/<strong>Date:<\/strong> (.*?)<\/p>/);

          // Essayer de retrouver la catégorie via la transcription
          const categoryMatch = content.match(/<strong>Catégorie:<\/strong>\s*(.*?)<\/p>/);
          const rawCategory = categoryMatch ? categoryMatch[1].trim() : null;
          const normalizedCategory = normalizeKey(rawCategory);

          // Déterminer la clé du type à partir de la catégorie ou du nom de fichier
          const resolvedTypeKey = (() => {
            if (rawCategory) {
              const entry = Object.entries(config.tickets.types).find(([, typeInfo]) =>
                normalizeKey(typeInfo.label) === normalizedCategory
              );
              if (entry) return entry[0];
            }

            const filenameHint = normalizeKey(file.split("_")[0]);
            const entry = Object.entries(config.tickets.types).find(([key]) =>
              normalizeKey(key) === filenameHint
            );
            return entry ? entry[0] : null;
          })();

          return {
            filename: file,
            title: titleMatch ? titleMatch[1] : "Ticket inconnu",
            date: dateMatch ? dateMatch[1] : "Date inconnue",
            url: `/transcript/${file}`,
            typeKey: resolvedTypeKey,
          };
        } catch (err) {
          console.error(`Erreur lecture ${file}:`, err);
          return null;
        }
      })
    );

    const validTranscripts = transcripts
      .filter((t) => t !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const ticketsByType = Object.entries(config.tickets.types).reduce((acc, [key]) => {
      acc[key] = [];
      return acc;
    }, {});

    for (const ticket of validTranscripts) {
      if (ticket.typeKey && ticketsByType[ticket.typeKey]) {
        ticketsByType[ticket.typeKey].push(ticket);
      }
    }

    res.render("index", {
      transcripts: validTranscripts,
      ticketsByType,
      config,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur serveur");
  }
});

// --- ROUTE POUR CHAQUE TRANSCRIPT ---
app.get("/transcript/:filename", (req, res) => {
  try {
    const filePath = path.join(transcriptsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("Transcription non trouvée");
    }
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur serveur");
  }
});

// --- Lancer le serveur web ---
const server = createServer(app);
server.listen(webPort, () => {
  console.log(`🌐 Interface web disponible sur http://51.83.6.5:${webPort}`);
});

// --- Discord Bot ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

(async () => {
  for (const file of commandFiles) {
    try {
      const { data, execute } = await import(`./commands/${file}`);
      if (data && execute) {
        client.commands.set(data.name, { data, execute });
        commands.push(data.toJSON());
      }
    } catch (error) {
      console.error(`Erreur commande ${file}:`, error);
    }
  }
})();

const INSTANCE_ID = Math.random().toString(36).substring(7);

client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag} [Instance: ${INSTANCE_ID}]`);

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log("✅ Commandes slash enregistrées !");
  } catch (error) {
    console.error("❌ Erreur enregistrement :", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const replyOptions = {
        content: "❌ Une erreur est survenue lors de l'exécution de cette commande.",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select_menu") {
    const selectedValue = interaction.values[0];
    const typeKey = selectedValue.replace("ticket_", "");
    if (config.tickets.types[typeKey]) {
      await createTicket(interaction, config, typeKey);
    }
  }

  if (interaction.isButton()) {
    const { customId } = interaction;
    if (customId === "ticket_close") {
      await closeTicket(interaction, config, false);
    } else if (customId === "ticket_close_request") {
      await closeTicket(interaction, config, true);
    }
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  handleVoiceRole(oldState, newState, config);
});

client.login(config.token).catch(console.error);

process.on("unhandledRejection", (error) => {
  console.error("Erreur non gérée :", error);
});
