import './App.css';
import React, {useEffect} from "react";

import VideoPlayer, {FullScreenButton, PlayButton, ToolbarTimer, VolumeButton} from "./component/mika-video-player";
import SpeedButton from "./component/mika-video-player/Controller/ToolbarFunc/SpeedButton/SpeedButton.tsx";
import {DanmakuAttr} from "./component/mika-video-player/Danmaku/Danmaku.ts";
import Debugger from "./component/mika-video-player/Debugger";

const sess_data = "1443a408%2C1719124214%2Cb72e6%2Ac1CjDvyCp9vILksJqy6P2bYiAFgSgqe5SNZAZqtgODbz0Tw5PRo5uv9ZlLW5Sngurv7GMSVnpiSFE0X1pZQWE0Z2l2aHUzWFVVRzBvZm1Ma28zTmw3SDJLNkFzYWtKTkU4eHlXZlhNTDRLQl9XOTdOQ0NTZ3Y5SW41YXdaUnNZWXlwdkNzalZhU2V3IIEC";
const default_bv = 'BV1EE421M7zP';
let proxy_url = 'https://api.erisu.moe/proxy?pReferer=https://www.bilibili.com';

const getUrl = (bv: string) => {
    return 'https://b.erisu.moe/api/playurl/flv?bvid=' + bv + '&SESSDATA=' + sess_data;
};

const App: React.FC = () => {
    const [url, setUrl] = React.useState<string | undefined>(undefined);
    const [danmakus, setDanmakus] = React.useState<DanmakuAttr[]>([]);
    const ref = React.useRef<HTMLVideoElement>(null);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    useEffect(() => {
        const url = new URL(window.location.href);
        const bv = url.searchParams.get('bv');
        const c = getUrl(bv || default_bv);

        fetch(c).then(res => res.json()).then(data => {
            const host = data.data.durl[0].url.split('/')[2];
            proxy_url += '&pHost=' + host + '&pUrl=';
            setUrl(encodeURIComponent(data.data.durl[0].url));
        });

        fetch('https://b.erisu.moe/api/danmaku?bvid=' + (bv || default_bv) + '&SESSDATA=' + sess_data).then(res => res.json()).then(data => {
            const newDanmakus: DanmakuAttr[] = [];
            for (const d of data) {
                if (d.color === 0) d.color = 0xffffff;
                newDanmakus.push({
                    begin: (parseFloat(d.progress) ?? 0) / 1000,
                    text: d.content,
                    color: '#' + parseInt(d.color).toString(16).padStart(6, '0'),
                    mode: d.mode,
                    size: d.fontsize,
                });
            }

            console.log(newDanmakus);
            setDanmakus(newDanmakus);
        });
    }, []);

    useEffect(() => {
        Debugger.setEnable(false);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        }}>

            <VideoPlayer
                width='80%'
                style={{
                    margin: "auto",
                    borderRadius: '20px',
                    overflow: 'hidden'
                }}
                controls
                toolbar={{
                    left: [PlayButton, ToolbarTimer],
                    middle: [],
                    right: [SpeedButton, VolumeButton, FullScreenButton],
                }}
                loop
                danmaku={danmakus}
                ref={ref}
                src={url ? proxy_url + url : undefined}
            >
            </VideoPlayer>
            <audio ref={audioRef}/>
        </div>
    )
};

export default App;
