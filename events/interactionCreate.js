const { Events, MessageFlags } = require("discord.js");

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
