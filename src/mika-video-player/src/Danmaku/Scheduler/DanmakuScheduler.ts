import { DanmakuManager } from '../Manager/DanmakuManager.ts';
import { DanmakuAttr } from '../Renderer';

// 在videoElement seeked事件后最大允许多少秒前的弹幕被添加至弹幕池
const ALLOWED_MAX_DELAY: number = 10;

export class DanmakuScheduler {
  video: HTMLVideoElement;

  danmakuManager: DanmakuManager;

  danmaku: DanmakuAttr[];

  currentIndex = 0;

  documentLock = false;

  delayLock = false;

  isDestroyed = false;

  private handleTimeUpdate = () => {
    if (this.video.paused || this.video.seeking) return;
    const { currentTime } = this.video;
    const tempList: (DanmakuAttr & { delay?: number | undefined })[] = [];

    while (this.currentIndex < this.danmaku.length && this.danmaku[this.currentIndex].begin <= currentTime) {
      if (this.documentLock) {
        this.currentIndex++;
        continue;
      }

      let delay = 0;
      if (this.delayLock) {
        delay = currentTime - this.danmaku[this.currentIndex].begin;
      }

      tempList.push({ ...this.danmaku[this.currentIndex++], delay });
    }
    this.delayLock = false;
    requestAnimationFrame(() => {
      this.danmakuManager.addDanmakuList(tempList);
    });
  };

  private handleSeeking = () => {
    this.delayLock = true;

    let l = 0;
    let r = this.danmaku.length - 1;

    while (l < r) {
      const mid = Math.floor((l + r) / 2);
      if (this.danmaku[mid].begin < this.video.currentTime - ALLOWED_MAX_DELAY) {
        l = mid + 1;
      } else {
        r = mid;
      }
    }

    this.currentIndex = l;
  };

  private handleVisibilityChange = () => {
    this.documentLock = document.hidden;
  };

  constructor(video: HTMLVideoElement, container: HTMLDivElement, danmaku: DanmakuAttr[]) {
    this.video = video;
    this.danmakuManager = new DanmakuManager(container, video);
    this.danmaku = danmaku;

    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
    this.video.addEventListener('seeking', this.handleSeeking);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    danmaku.sort((a, b) => a.begin - b.begin);
    this.isDestroyed = false;
  }

  public destroy() {
    this.video.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.video.removeEventListener('seeked', this.handleSeeking);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.danmakuManager.destroy();
    this.isDestroyed = true;
  }

  public addDanmakuAtNow(danmaku: DanmakuAttr[]) {
    const { currentTime } = this.video;
    const delay = 0.1;
    danmaku.forEach((item) => {
      item.begin = currentTime + delay;
    });
    this.addDanmaku(danmaku);

    return currentTime + delay;
  }

  public addDanmaku(danmaku: DanmakuAttr[]) {
    if (this.danmaku.length === 0) {
      danmaku.sort((a, b) => a.begin - b.begin);
      this.danmaku = danmaku;
      return;
    }

    const nowItem = this.danmaku[this.currentIndex];
    this.danmaku = this.danmaku.concat(danmaku);
    this.danmaku.sort((a, b) => a.begin - b.begin);

    // 更新currentIndex
    let l = 0;
    let r = this.danmaku.length - 1;

    while (l < r) {
      const mid = Math.floor((l + r) / 2);
      if (this.danmaku[mid].begin < nowItem.begin) {
        l = mid + 1;
      } else {
        r = mid;
      }
    }

    this.currentIndex = l;
  }

  public clearDanmaku() {
    this.danmaku = [];
    this.currentIndex = 0;
  }

  public getCurrentDanmakuCount() {
    return this.danmakuManager.getCurrentDanmakuCount();
  }
}
