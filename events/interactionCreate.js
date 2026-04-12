const { Events, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require("discord.js");
const scrimState = require("../utils/scrimState");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith("rr_")) {
        const roleId = interaction.customId.split("_")[1];
        
        try {
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) {
            return interaction.reply({ content: "❌ Este rol ya no existe en el servidor.", flags: MessageFlags.Ephemeral });
          }

          const hasRole = interaction.member.roles.cache.has(roleId);
          if (hasRole) {
            await interaction.member.roles.remove(roleId);
            return interaction.reply({ content: `✅ Se te ha retirado el rol **${role.name}**.`, flags: MessageFlags.Ephemeral });
          } else {
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: `✅ Se te ha asignado el rol **${role.name}**.`, flags: MessageFlags.Ephemeral });
          }
        } catch (error) {
          console.error("Error managing reaction role:", error);
          return interaction.reply({ content: "⚠️ Faltan permisos para gestionar este rol o está por encima del bot.", flags: MessageFlags.Ephemeral });
        }
      } else if (interaction.customId.startsWith("scrim_")) {
        const action = interaction.customId;
        const msgId = interaction.message.id;

        // --- SCRIM TEARDOWN ---
        if (action === "scrim_end") {
          // Require manage server
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: "❌ Restringido a Administradores.", flags: MessageFlags.Ephemeral });
          }
          
          const queue = scrimState.activeScrims.get(msgId);
          if (!queue) return interaction.reply({ content: "⚠️ Cola borrada de memoria.", flags: MessageFlags.Ephemeral });

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          if (queue.blueChannelId) await interaction.guild.channels.cache.get(queue.blueChannelId)?.delete().catch(()=>{});
          if (queue.redChannelId) await interaction.guild.channels.cache.get(queue.redChannelId)?.delete().catch(()=>{});
          scrimState.activeScrims.delete(msgId);

          const endEmbed = new EmbedBuilder().setTitle(queue.title).setDescription("🛑 Scrim terminada y canales disueltos.").setColor("#475569");
          await interaction.message.edit({ embeds: [endEmbed], components: [] });
          return interaction.editReply("Canales destruidos y caché libedara.");
        }

        // --- QUEUE LOGIC ---
        const queue = scrimState.activeScrims.get(msgId);
        if (!queue) return interaction.reply({ content: "⌛ Esta cola ya caducó o el bot se reinició.", flags: MessageFlags.Ephemeral });

        if (queue.status !== "queue") return interaction.reply({ content: "🚫 Esta partida ya inició.", flags: MessageFlags.Ephemeral });

        if (action === "scrim_join") {
          if (queue.players.has(interaction.user.id)) return interaction.reply({ content: "⚠️ Ya estás en la cola.", flags: MessageFlags.Ephemeral });
          queue.players.add(interaction.user.id);
        } else if (action === "scrim_leave") {
          if (!queue.players.has(interaction.user.id)) return interaction.reply({ content: "⚠️ No estás en la cola.", flags: MessageFlags.Ephemeral });
          queue.players.delete(interaction.user.id);
        }

        // Check if queue is full
        if (queue.players.size >= queue.maxPlayers) {
          queue.status = "active";
          await interaction.deferUpdate();

          // Shuffle Players
          const playerArr = Array.from(queue.players);
          for (let i = playerArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerArr[i], playerArr[j]] = [playerArr[j], playerArr[i]];
          }

          const blueTeam = playerArr.slice(0, queue.teamSize);
          const redTeam = playerArr.slice(queue.teamSize);

          // Create Voice Channels
          try {
            const guildId = interaction.guild.id;
            const blueOverwrites = [
              { id: guildId, deny: [PermissionFlagsBits.ViewChannel] },
              { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
              ...blueTeam.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }))
            ];
            
            const redOverwrites = [
              { id: guildId, deny: [PermissionFlagsBits.ViewChannel] },
              { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
              ...redTeam.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }))
            ];

            const blueCh = await interaction.guild.channels.create({
              name: `🛡️ Equipo Azul (${queue.title})`,
              type: ChannelType.GuildVoice,
              permissionOverwrites: blueOverwrites
            });

            const redCh = await interaction.guild.channels.create({
              name: `🗡️ Equipo Rojo (${queue.title})`,
              type: ChannelType.GuildVoice,
              permissionOverwrites: redOverwrites
            });

            queue.blueChannelId = blueCh.id;
            queue.redChannelId = redCh.id;

            const bluePing = blueTeam.map(id => `<@${id}>`).join("\n");
            const redPing = redTeam.map(id => `<@${id}>`).join("\n");

            const activeEmbed = new EmbedBuilder()
              .setTitle(`⚔️ PARTIDA ACTIVA: ${queue.title}`)
              .setDescription(`¡Lobby Lleno! Únanse a sus respectivos canales de voz seguros abajo.\n\n` + 
                `**🛡️ Equipo Azul**\n${bluePing}\n\n**🗡️ Equipo Rojo**\n${redPing}`)
              .setColor("#10b981");

            const endRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("scrim_end").setLabel("🛑 Finalizar Match & Borrar Canales").setStyle(ButtonStyle.Danger)
            );

            await interaction.message.edit({ embeds: [activeEmbed], components: [endRow] });
          } catch (e) {
            console.error(e);
            const errEmbed = new EmbedBuilder().setTitle("Error").setDescription("Falló la creación física de canales... ¿Faltan Permisos?").setColor("#ef4444");
            await interaction.message.edit({ embeds: [errEmbed], components: [] });
          }
          return;
        }

        // Just update queue info normally if not full
        const pingArr = Array.from(queue.players).map(id => `<@${id}>`).join("\n") || "*Nadie se ha unido aún.*";
        
        const updateEmbed = new EmbedBuilder()
          .setTitle(`⚔️ ${queue.title} (${queue.teamSize}v${queue.teamSize})`)
          .setDescription(`Hagan click para unirse a la cola de Matchmaking.\n\n**Jugadores en Cola (${queue.players.size}/${queue.maxPlayers}):**\n${pingArr}`)
          .setColor("#ff1b51");

        const updateRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("scrim_join").setLabel(`Unirse (${queue.players.size}/${queue.maxPlayers})`).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("scrim_leave").setLabel("Salir").setStyle(ButtonStyle.Secondary)
        );

        await interaction.update({ embeds: [updateEmbed], components: [updateRow] });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);

      const errorMessage = {
        content: "There was an error executing this command!",
        flags: MessageFlags.Ephemeral,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        // Interaction already expired, just log it
        console.error("Could not send error message - interaction expired");
      }
    }
  },
};
