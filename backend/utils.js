import { spawn } from 'child_process';
import path from 'path';

// Helper to get video duration using ffprobe
export const getVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        // ffprobe is included in most FFmpeg installations
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            filePath
        ]);

        let output = '';

        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobe.on('close', (code) => {
            if (code === 0) {
                const duration = parseFloat(output);
                resolve(duration);
            } else {
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });

        ffprobe.on('error', (err) => {
            reject(err);
        });
    });
};

export class TaskQueue {
    constructor(concurrencyLimit) {
        this.concurrencyLimit = concurrencyLimit;
        this.running = 0;
        this.queue = [];
    }

    // Takes a function returning a Promise
    enqueue(taskFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                taskFn,
                resolve,
                reject
            });
            this.processNext();
        });
    }

    processNext() {
        if (this.running >= this.concurrencyLimit || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        this.running++;

        task.taskFn()
            .then((result) => task.resolve(result))
            .catch((error) => task.reject(error))
            .finally(() => {
                this.running--;
                this.processNext();
            });
    }

    getStats() {
        return {
            runningTasks: this.running,
            queuedTasks: this.queue.length
        };
    }
}
