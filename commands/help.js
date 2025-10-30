                                            import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
                                            import config from "../config.json" with { type: "json" };

                                            export const data = new SlashCommandBuilder()
                                              .setName("help")
                                              .setDescription("Affiche toutes les commandes administrateurs (FiveM & Discord)");

                                            export async function execute(interaction, client) {
                                              const member = interaction.member;

                                              // Vérif rôles autorisés
                                              const hasPermission = config.roles.cvcRoles.some(roleId =>
                                                member.roles.cache.has(roleId)
                                              );
                                              if (!hasPermission) {
                                                return interaction.reply({
                                                  content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
                                                  ephemeral: true,
                                                });
                                              }

                                              const embed = new EmbedBuilder()
                                                .setTitle("📜 Commandes Administrateurs")
                                                .setColor("#0099ff")
                                                .setThumbnail("https://cdn.discordapp.com/attachments/1251611248450343075/1427724240404349020/Projet_Redimensionner_une_image.png?ex=69025c50&is=69010ad0&hm=ee969be71fa9b9e19fd99159ab42c9a8a12c9617ffbb0094701fb078c5dcadee&")
                                                .setDescription("Voici la liste des commandes disponibles pour les admins sur le serveur FiveM et Discord :")
                                                .addFields(
                                                  { name: "🎮 Commandes FiveM", value: `
                                            \`/freeroamall\` → Fin de session
                                            \`F4\` → Menu admin
                                            \`F6\` → Menu joueurs
                                            \`F7\` → Menu contributeurs
                                            \`/screen <id>\` → Vérifier un joueur via screenshot (anti-cheat)
                                            `},
                                                  { name: "💻 Commandes Discord", value: `
                                            \`/open\` → Planifie l'ouverture des salons vocaux
                                            \`/annonce\` → Envoye une annonce   
                                            \`/lock\` → Ferme un salon vocal
                                            \`/annuler\` → Annule une plannification d'ouverture de salon vocal
                                            \`/deco\` → Déco toutes les personnes d'un salon vocal 
                                            \`/cvc\` → Annonce un CVC
                                            \`/gdt\` → Annonce un GDT                                                 \`/slot\` → Modifie les slots d'une vocale
                                            \`/help\` → Affiche cet embed
                                            `}
                                                )
                                                .setFooter({ text: "Admin Panel FiveM & Discord", iconURL: "https://cdn.discordapp.com/attachments/1251611248450343075/1427724115774541884/Adobe_Express_-_file.png?ex=68efe733&is=68ee95b3&hm=251d6a97b2815ccf2784e66a873968f63782cab4d29c6138746de5502590cd8e&" })
                                                .setTimestamp();

                                              await interaction.reply({ embeds: [embed], ephemeral: false });
                                            }
