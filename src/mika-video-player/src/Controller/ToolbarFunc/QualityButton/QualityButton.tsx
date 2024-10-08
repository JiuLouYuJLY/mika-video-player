import React, { memo, useCallback, useEffect, useState } from 'react';

import './QualityButton.less';
import { Dropdown } from '../../../Component';
import { useStore } from 'mika-store';

const QualityButton = memo(() => {
  const [{ videoElement, src }] = useStore<any>('mika-video-extra-data');

  const [quality, setQuality] = useState('清晰度');
  const [activeIndex, setActiveIndex] = useState(0);
  const [qualityList, setQualityList] = useState<string[]>([]);

  useEffect(() => {
    if (typeof src === 'string' || !src?.srcs || src?.srcs?.length === 0) return;
    setQualityList(src?.srcs.map((item: { type: any }) => item.type) || []);
    setQuality(src?.srcs[src.default ?? 0].type);
  }, [src, src]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const quality = parseInt((e.target as HTMLDivElement).dataset.quality!, 10);
      setQuality(src?.srcs[quality].type);
      setActiveIndex(quality);

      let url = src?.srcs[quality].url;
      if (url instanceof Function) {
        url = url();
      }

      const current = videoElement?.currentTime || 0;
      videoElement && (videoElement.src = url);
      videoElement && (videoElement.currentTime = current);
      videoElement?.play().catch(undefined);
    },
    [src, videoElement],
  );

  if (typeof src === 'string') {
    return null;
  }

  return (
    <Dropdown
      menu={
        <div className='mika-video-player-toolbar-function-Quality-dropdown-menu'>
          {qualityList.map((item, index) => (
            <div
              key={index}
              className={`mika-video-player-toolbar-function-Quality-dropdown-item${activeIndex === index ? ' active' : ''}`}
              data-quality={index}
              onClick={onClick}
            >
              {item}
            </div>
          ))}
        </div>
      }
      direction='up'
      paddingTrigger={10}
    >
      <div className='mika-video-player-toolbar-function-Quality-button'>
        <span>{quality}</span>
      </div>
    </Dropdown>
  );
});

QualityButton.displayName = 'QualityButton';
export default QualityButton;
