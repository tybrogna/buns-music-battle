import { render } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks';
import Select from 'react-select'

function MusicTest() {
    const [song, setSong] = useState('./games/test-game/songs/schala.mp3#t=00:00:05')

    let options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]

    return (
        <div>
            <div style="width:500px;">
                <Select options={options} />
            </div>
            <input type='button' value='do it' onClick={e => setSong('./games/test-game/songs/uldah.mp3#t=00:00:05')} />
            <input type='button' value='more opts' onClick={e => options.push('bruh')} />
            <audio src={song} controls/>
            <div id='`slfjeb'>weirdo</div>
            <div id="less-id">weirdo</div>
        </div>
    )
}

export default function() {
    // console.log(document.querySelector('#`i-ha//ve-a-we.\\r`d-id'))
    // console.log(document.querySelector("#less-'weird'-id"))
    render(MusicTest(), document.body)
}