import { render } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks';
// import Select from 'react-select'
import { fs_readdir } from '@app/preload'

export default function FileTest() {
    // const [song, setSong] = useState('./games/test-game/songs/schala.mp3#t=00:00:05')
    const [song, setSong] = useState('')

    let options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]

    async function fileCheck(e) {
        console.log(document.querySelector('#yk').value)
        console.log(await fs_readdir(document.querySelector('#yk').value))
    }

    return (
        <div>
            {/* <div style="width:500px;">
                <Select options={options} />
            </div> */}
            <input id='yk' type='text' />
            <input type='button' value='activate file check' onClick={fileCheck}/>
            {/* <input type='button' value='do it' onClick={e => setSong('./games/test-game/songs/uldah.mp3#t=00:00:05')} /> */}
            {/* <input type='button' value='more opts' onClick={e => options.push('bruh')} />
            <audio src={song} controls/> */}
        </div>
    )
}
