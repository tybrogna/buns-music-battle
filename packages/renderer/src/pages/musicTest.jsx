import { render } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { fs_readFile, fs_readMp3 } from '@app/preload'
// import { protocol } from 'electron'
// import Select from 'react-select'

import '../css/musicTest.css'

export default function MusicTest() {
    let set = 15
    const [song, setSong] = useState('')
    const [lol, setLol] = useState(set)
    const [running, setRunning] = useState(true)

    // let options = [
    //     { value: 'chocolate', label: 'Chocolate' },
    //     { value: 'strawberry', label: 'Strawberry' },
    //     { value: 'vanilla', label: 'Vanilla' }
    // ]

    let fetchIt = async (e) => {
        console.log('honk honk')
        // let mp3Data = await fs_readMp3('C:/Users/tybro/Documents/big-ear-battle-games/test-game/songs/uldah.mp3')
        // document.querySelector('audio').src = mp3Data
        // document.querySelector('audio').currentTime = 10
    }

    useEffect(() => {
        if (!running) {
            return
        }

        let timer = setTimeout(() => {
            if (lol >= 0) {
                setLol(time => time - .1)
                let te = document.querySelector('.timer')
                let svg = te.querySelector('svg > circle + circle')
                const normalizedTime = (set - lol) / set;
                svg.style.strokeDashoffset = normalizedTime;
            }
        }, 100)
    }, [lol, running])

    let windowHeight = window.innerHeight
    let windowWidth = window.innerWidth
    console.log(windowWidth, windowHeight)
    console.log(windowWidth / 4, windowHeight / 4)
    console.log(Math.min(windowWidth / 4, windowHeight / 4))

    return (
        <div>
            {/* <div style="width:500px;">
                <Select options={options} />
            </div> */}
            {/* <input type='button' value='fetchit' onClick={fetchIt} />
            <input type='button' value='more opts' onClick={e => options.push('bruh')} />
            <audio src={'asset:///C:/Users/tybro/Downloads/small.mp3#t=9'} controls/>
            <img src={'asset:///C:/Users/tybro/Downloads/FFXV_Money.avif'} /> */}
            {/*thanks to kirti vernekar's clever css countdown spinner https://codepen.io/kirtivernekar/pen/PoJOMbb */}
            <div class="timer animatable">
                <svg>
                    <circle cx="50%" cy="50%" r="235"/>
                    <circle cx="50%" cy="50%" r="235" pathLength="1" />
                    <text x="50%" y="50%" text-anchor="middle"><tspan id="timeLeft">{lol.toFixed(0)}</tspan></text>
                    <foreignObject x="48%" y="60%" width="75" height="50">
                        <input style='height: 40px' type='button' value='pauza' onClick={() => {setRunning(!running)} } />
                    </foreignObject>
                </svg>
            </div>
        </div>
    )
}
