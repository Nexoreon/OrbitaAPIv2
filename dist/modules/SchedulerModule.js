"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const toad_scheduler_1 = require("toad-scheduler");
const node_schedule_1 = __importDefault(require("node-schedule"));
const configurationModel_1 = __importDefault(require("../models/configurationModel"));
// IMPORTED TASKS
const NotificationsModule_1 = __importDefault(require("./NotificationsModule"));
const updateSpotifyToken_1 = __importDefault(require("./SchedulerModuleTasks/updateSpotifyToken"));
const updateSpotifyPlaylists_1 = __importDefault(require("./SchedulerModuleTasks/updateSpotifyPlaylists"));
const importTwitchNotifications_1 = __importDefault(require("./SchedulerModuleTasks/importTwitchNotifications"));
const scheduler = new toad_scheduler_1.ToadScheduler();
// Check if any notifications send out planned
setTimeout(NotificationsModule_1.default, 2500);
// Update Spotify token
node_schedule_1.default.scheduleJob({ hour: 23, minute: 45, tz: 'Europe/Moscow' }, async () => {
    const config = await configurationModel_1.default.findOne({ appId: 3 });
    if (config?.settings.enablePlaylistAutoUpdate)
        (0, updateSpotifyToken_1.default)();
});
// Update Spotify playlists
node_schedule_1.default.scheduleJob({ hour: 23, minute: 46, tz: 'Europe/Moscow' }, async () => {
    const config = await configurationModel_1.default.findOne({ appId: 3 });
    if (config?.settings.enablePlaylistAutoUpdate)
        (0, updateSpotifyPlaylists_1.default)();
});
// Import notifications from Twitch Hub app
const importNotifications = new toad_scheduler_1.SimpleIntervalJob({ minutes: 30 }, new toad_scheduler_1.Task('importTwitchNotifications', importTwitchNotifications_1.default));
scheduler.addSimpleIntervalJob(importNotifications);
