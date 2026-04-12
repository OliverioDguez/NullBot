/**
 * Scrims Matchmaker State Cache
 * Uses an in-memory Map to track active Discord match Queues.
 */

const activeScrims = new Map();
// Structure of Map value:
// {
//    channelId: String,
//    title: String,
//    teamSize: Number, // (e.g. 5 for 5v5)
//    maxPlayers: Number, // teamSize * 2
//    players: Set<String> (User IDs)
//    status: "queue" | "active"
// }

module.exports = {
  activeScrims
};
