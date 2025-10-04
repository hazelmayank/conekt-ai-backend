const cron = require('node-cron');
const playlistUtils = require('./playlist');

class PlaylistScheduler {
  constructor() {
    this.tasks = new Map();
    this.isEnabled = process.env.ENABLE_PLAYLIST_SCHEDULER !== 'false';
    
    if (this.isEnabled) {
      this.startAllTasks();
    }
  }

  /**
   * Start all scheduled tasks
   */
  startAllTasks() {
    console.log('🎵 Starting PlaylistSchedule...');
    
    // Schedule playlist refresh every 2 hours
    this.schedulePlaylistRefresh();
    
    // Schedule daily playlist pre-generation at 11 PM every day
    this.scheduleDailyRefresh();
    
    // Schedule early morning playlist check at 6 AM 
    this.scheduleMorningCheck();
    
    console.log('✅ All playlist scheduler tasks started');
  }

  /**
   * Schedule playlist refresh every 2 hours
   * This keeps playlists updated with latest campaign content
   */
  schedulePlaylistRefresh() {
    const task = cron.schedule('0 */2 * * *', async () => {
      console.log('🔄 [SCHEDULED] Refreshing all playlists...');
      
      try {
        const result = await playlistUtils.generatePlaylistsForAllTrucks();
        
        if (result.success) {
          console.log(`✅ [SCHEDULED] Playlist refresh completed:`, result.summary);
        } else {
          console.error(`❌ [SCHEDULED] Playlist refresh failed:`, result.error);
        }
      } catch (error) {
        console.error(`❌ [SCHEDULED] Unexpected error during playlist refresh:`, error);
      }
    }, {
      scheduled: false, // Don't start automatically
      timezone: "Asia/Kolkata"
    });

    task.start();
    this.tasks.set('playlist_refresh', task);
    
    console.log('⏰ Scheduled: Playlist refresh every 2 hours');
  }

  /**
   * Schedule daily playlist refresh at 11 PM
   * This ensures tomorrow's playlists are ready
   */
  scheduleDailyRefresh() {
    const task = cron.schedule('0 23 * * *', async () => {
      console.log('🌙 [SCHEDULED] Generating tomorrow\'s playlists...');
      
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const result = await playlistUtils.generatePlaylistsForAllTrucks(tomorrow);
        
        if (result.success) {
          console.log(`✅ [SCHEDULED] Tomorrow's playlists generated:`, result.summary);
        } else {
          console.error(`❌ [SCHEDULED] Tomorrow's playlist generation failed:`, result.error);
        }
      } catch (error) {
        console.error(`❌ [SCHEDULED] Unexpected error during tomorrow's playlist generation:`, error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    task.start();
    this.tasks.set('daily_refresh', task);
    
    console.log('⏰ Scheduled: Daily playlist generation at 11 PM');
  }

  /**
   * Schedule morning checklist at 6 AM
   * Verifies today's playlists are ready and pushes any pending updates
   */
  scheduleMorningCheck() {
    const task = cron.schedule('0 6 * * *', async () => {
      console.log('🌅 [SCHEDULED] Morning playlist check starting...');
      
      try {
        // Check if today's playlists exist and are valid
        const result = await playlistUtils.generatePlaylistsForAllTrucks();
        
        if (result.success) {
          console.log(`✅ [SCHEDULED] Morning check completed:`, result.summary);
          
          // Log any trucks with pending playlists
          if (result.summary.pending > 0) {
            console.log(`⚠️ [SCHEDULED] ${result.summary.pending} playlists need manual push`);
          }
        } else {
          console.error(`❌ [SCHEDULED] Morning check failed:`, result.error);
        }
      } catch (error) {
        console.error(`❌ [SCHEDULED] Unexpected error during morning check:`, error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    task.start();
    this.tasks.set('morning_check', task);
    
    console.log('⏰ Scheduled: Morning playlist check at 6 AM');
  }

  /**
   * Enable a specific task
   */
  enableTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      console.log(`✅ Enabled task: ${taskName}`);
    } else {
      console.warn(`⚠️ Task not found: ${taskName}`);
    }
  }

  /**
   * Disable a specific task
   */
  disableTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.destroy();
      console.log(`❌ Disabled task: ${taskName}`);
    } else {
      console.warn(`⚠️ Task not found: ${taskName}`);
    }
  }

  /**
   * Get status of all tasks
   */
  getTasksStatus() {
    const status = {};
    
    for (const [name, task] of this.tasks) {
      status[name] = {
        scheduled: task.getStatus() === 'scheduled',
        nextInvocation: task.nextDate()
      };
    }
    
    return status;
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks() {
    console.log('🛑 Stopping all playlist scheduler tasks...');
    
    for (const [name, task] of this.tasks) {
      task.destroy();
    }
    
    this.tasks.clear();
    console.log('✅ All scheduler tasks stopped');
  }

  /**
   * Manually trigger playlist refresh for all trucks
   */
  async triggerManualRefresh(date = new Date()) {
    console.log(`🚀 [MANUAL] Triggering playlist refresh for ${date.toISOString()}...`);
    
    try {
      const result = await playlistUtils.generatePlaylistsForAllTrucks(date);
      
      if (result.success) {
        console.log(`✅ [MANUAL] Playlist refresh completed:`, result.summary);
        return {
          success: true,
          message: 'Manual playlist refresh completed',
          summary: result.summary
        };
      } else {
        console.error(`❌ [MANUAL] Playlist refresh failed:`, result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error(`❌ [MANUAL] Unexpected error during manual refresh:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      tasksCount: this.tasks.size,
      tasks: this.getTasksStatus(),
      uptime: process.uptime()
    };
  }
}

module.exports = PlaylistScheduler;
