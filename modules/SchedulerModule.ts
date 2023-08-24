import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import nodeScheduler from 'node-schedule';
import Configuration from '../models/configurationModel';

// IMPORTED TASKS
import NotificationsModule from './NotificationsModule';
import updateSpotifyToken from './SchedulerModuleTasks/updateSpotifyToken';
import updateSpotifyPlaylists from './SchedulerModuleTasks/updateSpotifyPlaylists';
import importTwitchNotifications from './SchedulerModuleTasks/importTwitchNotifications';

const scheduler = new ToadScheduler();

// Check if any notifications send out planned
setTimeout(NotificationsModule, 2500);
// Update Spotify token
nodeScheduler.scheduleJob({ hour: 23, minute: 45, tz: 'Europe/Moscow' }, async () => {
    const config = await Configuration.findOne({ appId: 3 });
    if (config?.settings.enablePlaylistAutoUpdate) updateSpotifyToken();
});
// Update Spotify playlists
nodeScheduler.scheduleJob({ hour: 23, minute: 46, tz: 'Europe/Moscow' }, async () => {
    const config = await Configuration.findOne({ appId: 3 });
    if (config?.settings.enablePlaylistAutoUpdate) updateSpotifyPlaylists();
});

// Import notifications from Twitch Hub app
const importNotifications = new SimpleIntervalJob({ minutes: 30 }, new Task('importTwitchNotifications', importTwitchNotifications));
scheduler.addSimpleIntervalJob(importNotifications);
