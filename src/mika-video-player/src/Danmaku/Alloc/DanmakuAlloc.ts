import { DanmakuAttr } from '../Renderer';

export interface Interval {
  // 区间左端点
  left: number;
  // 区间右端点
  right: number;

  /* 区间额外信息 */
  // 开始时间
  start: number;
  // 持续时间
  duration: number;
  // 长度
  width: number;
}

export class DanmakuAlloc {
  private trackList: Interval[][] = [];

  private enableMultiTrack = false;

  private containerHeight: number;

  constructor(height: number) {
    this.containerHeight = height;
  }

  set ContainerHeight(height: number) {
    this.containerHeight = height;

    // 重新计算轨道, 如果轨道超出容器高度则回收
    this.trackList.forEach((trackList) => {
      for (let i = 0; i < trackList.length; i++) {
        if (trackList[i].right > this.containerHeight) {
          trackList.splice(i, 1);
          i--;
        }
      }
    });
  }

  set EnableMultiTrack(enable: boolean) {
    this.enableMultiTrack = enable;
  }

  // 判断轨道是否空闲可用
  private isFree(track: Interval, danmaku: DanmakuAttr): boolean {
    return track.start + track.duration <= danmaku.begin;
  }

  private combineTrack(
    index: number,
    danmaku: DanmakuAttr,
    trackListIndex: number,
    width: number,
    height: number,
    duration: number,
    compare: (a: Interval, danmaku: DanmakuAttr) => boolean,
  ) {
    // 持续尝试合并轨道，直到满足height的需求
    let cur = index;
    let { right } = this.trackList[trackListIndex][index];
    while (
      cur + 1 < this.trackList[trackListIndex].length &&
      compare(this.trackList[trackListIndex][cur + 1], danmaku) &&
      right - this.trackList[trackListIndex][index].left < height
    ) {
      cur++;
      right = this.trackList[trackListIndex][cur].right;
    }

    if (right - this.trackList[trackListIndex][index].left < height) {
      // 如果合并后的轨道仍然无法满足需求，则返回-1
      // 但是如果已经合并到最后一个轨道，可以开辟一小块新的轨道再次尝试合并，且新轨道不会超过容器高度
      if (
        cur + 1 === this.trackList[trackListIndex].length &&
        this.trackList[trackListIndex][index].left + height <= this.containerHeight
      ) {
        this.trackList[trackListIndex].push({
          left: right,
          right: height + this.trackList[trackListIndex][index].left,
          start: this.trackList[trackListIndex][cur].start,
          duration: this.trackList[trackListIndex][cur].duration,
          width: this.trackList[trackListIndex][cur].width,
        });
        cur++;
      } else return -1;
    }

    const lastTrack = JSON.parse(JSON.stringify(this.trackList[trackListIndex][cur]));
    const i = index + 1;
    while (i <= cur) {
      right = this.trackList[trackListIndex][i].right;
      this.trackList[trackListIndex].splice(i, 1);
      cur--;
    }

    if (right - this.trackList[trackListIndex][index].left > height) {
      this.trackList[trackListIndex].splice(index + 1, 0, {
        left: this.trackList[trackListIndex][index].left + height,
        right,
        start: lastTrack.start,
        duration: lastTrack.duration,
        width: lastTrack.width,
      });
    }

    this.useTrack(this.trackList[trackListIndex][index], danmaku, width, height, duration);
    return this.trackList[trackListIndex][index].left;
  }

  private size = (danmaku: Interval) => danmaku.right - danmaku.left;

  private useTrack = (track: Interval, danmaku: DanmakuAttr, width: number, height: number, duration: number) => {
    track.right = track.left + height;
    track.start = danmaku.begin;
    track.duration = duration;
    track.width = width;
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  private debugCheck = () => {
    // 检查上一个轨道的右端点是否等于下一个轨道的左端点
    for (let i = 0; i < this.trackList.length; i++) {
      for (let j = 1; j < this.trackList[i].length; j++) {
        if (this.trackList[i][j].left !== this.trackList[i][j - 1].right) {
          console.error(
            `Track ${j} in list ${i} is not connected with previous track`,
            this.trackList[i][j - 1],
            this.trackList[i][j],
          );
        }
      }
    }

    // 检查轨道是否重叠
    for (let i = 0; i < this.trackList.length; i++) {
      for (let j = 0; j < this.trackList[i].length; j++) {
        for (let k = j + 1; k < this.trackList[i].length; k++) {
          if (
            this.trackList[i][j].left < this.trackList[i][k].right &&
            this.trackList[i][j].right > this.trackList[i][k].left
          ) {
            console.error(
              `Track ${j} and ${k} in list ${i} are overlapping`,
              this.trackList[i][j],
              this.trackList[i][k],
            );
          }
        }
      }
    }
  };

  /**
   * Tries to allocate a track for a given danmaku.
   *
   * @param {DanmakuAttr} danmaku - The danmaku for which a track needs to be allocated.
   * @param {number} duration - The duration for which the danmaku needs to be displayed, in seconds.
   * @param {number} width - The width of the danmaku.
   * @param {number} height - The height of the danmaku.
   * @param {(track: Interval, danmaku: DanmakuAttr) => boolean} [comparer] - An optional comparison function to determine if a track is suitable for the danmaku. It's no need to consider the height of the track.
   *
   * @returns {number} - The left endpoint of the allocated track. If allocation fails, returns -1.
   */
  public tryAllocTrack(
    danmaku: DanmakuAttr,
    duration: number,
    width: number,
    height: number,
    comparer?: (track: Interval, danmaku: DanmakuAttr) => boolean,
  ): number {
    const _getAvailableTrack = (
      danmaku: DanmakuAttr,
      duration: number,
      trackListIndex: number,
      comparer: (i: Interval, danmaku: DanmakuAttr) => boolean,
    ): number => {
      if (trackListIndex >= this.trackList.length) {
        this.trackList.push([]);
      }

      const list = this.trackList[trackListIndex];

      // 首次适应算法
      for (let i = 0; i < list.length; i++) {
        if (!comparer(list[i], danmaku)) continue;

        // 如果当前轨道满足需求, 则直接使用
        if (this.size(list[i]) === height) {
          this.useTrack(list[i], danmaku, width, height, duration);
          return list[i].left;
        }

        // 如果当前轨道宽度大于需求高度，则尝试分割轨道
        if (this.size(list[i]) > height) {
          const { right } = list[i];

          list.splice(i + 1, 0, {
            left: list[i].left + height,
            right,
            start: list[i].start,
            duration: list[i].duration,
            width: list[i].width,
          });

          this.useTrack(list[i], danmaku, width, height, duration);
          return list[i].left;
        }

        // 尝试合并轨道，合并成功则回退一步判断合并后的轨道是否满足需求
        const ret = this.combineTrack(i, danmaku, trackListIndex, width, height, duration, comparer);
        if (ret !== -1) return ret;
      }

      // 如果开启多轨道列表模式，且当前轨道已满，则尝试下一个轨道列表
      const right = list.length > 0 ? list[list.length - 1].right : 0;
      if (right + height > this.containerHeight) {
        if ((this.enableMultiTrack || danmaku.ignoreAllocCheck) && this.containerHeight) {
          return _getAvailableTrack(danmaku, duration, trackListIndex + 1, comparer);
        }
        return -1;
      }

      list.push({
        left: right,
        right: right + height,
        start: danmaku.begin,
        duration,
        width,
      });

      return right;
    };

    // this.debugCheck();
    return _getAvailableTrack(danmaku, duration, 0, comparer || this.isFree.bind(this));
  }

  public clear() {
    this.trackList = [];
  }
}
