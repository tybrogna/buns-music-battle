import { render } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { fs_readFile, fs_readMp3 } from '@app/preload'
// import { protocol } from 'electron'
// import Select from 'react-select'

export default function MusicTest() {
    const [song, setSong] = useState('')

    let options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]

    let fetchIt = async (e) => {
        let mp3Data = await fs_readMp3('C:/Users/tybro/Documents/big-ear-battle-games/test-game/songs/uldah.mp3')
        document.querySelector('audio').src = mp3Data
        document.querySelector('audio').currentTime = 10
        // let f = await fetch('asset:///C:/Users/tybro/Documents/big-ear-battle-games/test-game/songs/uldah.mp3#t=5')
        // console.log(f)
        // document.querySelector('audio').load()
    }


    return (
        <div>
            {/* <div style="width:500px;">
                <Select options={options} />
            </div> */}
            <input type='button' value='fetchit' onClick={fetchIt} />
            <input type='button' value='do it' onClick={e => setSong('asset:///C:/Users/tybro/Documents/big-ear-battle-games/test-game/songs/uldah.mp3#t=00:00:05')} />
            <input type='button' value='more opts' onClick={e => options.push('bruh')} />
            {/* <audio src={song} controls/> */}
            <audio src={'asset:///C:/Users/tybro/Downloads/small.mp3#t=9'} controls/>
            <img src={'asset:///C:/Users/tybro/Downloads/FFXV_Money.avif'} />
            {/* <img src={'asset:///I:/videos/thumbs.db/art/tme.jpg'} /> */}
            {/* <div id='`slfjeb'>weirdo</div> */}
            {/* <div id="less-id">weirdo</div> */}
        </div>
    )
}
