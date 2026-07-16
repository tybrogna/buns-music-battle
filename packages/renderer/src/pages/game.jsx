import { render } from 'preact'
import * as Settings from '../settings.js'
import { useState, useEffect, useRef } from 'preact/hooks'
// import { signal } from '@preact/signals'
import { $, $$$, delay, range, Song, shuffle } from '../js/helpers.js'

import '../css/game.css'

let teams = {}
let game = {}


function GameScreen() {
    let [haveGame, setHaveGame] = useState(false)
    let [activeCategory, setActiveCategory] = useState(null)
    let [activeSong, setActiveSong] = useState(null)

    useEffect(async () => {
        let selectedGameFolder = localStorage.getItem('gameFolder')
        // console.log(selectedGameFolder)
        let filesInFolder = await window.nodejs.call('filesInFolder', `./games/${selectedGameFolder}`)
        let jsonFileLoc = filesInFolder.filter(item => item.endsWith('.json'))[0]  // first json file in folder
        let jsonData = await window.nodejs.call('readFile', `./games/${selectedGameFolder}/${jsonFileLoc}`)
        Object.entries(jsonData.music).forEach(([key, val]) => {
            val.songs.forEach(song => song.played = false)
        })
        game = jsonData
        game.songsLocation = `./games/${selectedGameFolder}/songs`
        game.albumsLocation = `./games/${selectedGameFolder}/albums`
        game.backgroundsLocation = `./games/${selectedGameFolder}/bgs`
        game.music.forEach(category => {
            category.songs.forEach(song => {
                if (song.composer == null) {
                    song.composer = ""
                }
                if (song.game == null) {
                    song.game = ""
                }
                if (song.artist == null) {
                    song.artist = ""
                }
                if (song.album == null) {
                    song.album = ""
                }
            })
        })
        console.log(game)
        setHaveGame(true)
    }, []) //run only once

    // claude helped with this one. needed help wrapping my head around how useEffect worked
    //   the general idea is mine, send this function from here with the relevant data down to
    //      the html location where they'll be needed
    let selectCategory = (category) => {
        let choices = unplayedSongs(category)
        if (!choices || choices.length == 0)
            return
        let song = shuffle(choices)[0]
        song.played = true
        setActiveCategory(category)
        setActiveSong(song)
        $('#player-overlay').style.display = 'block'
    }

    let openOverlay = (event) => {
        $('#player-overlay').style.display = 'block'
    }

    let closeOverlay = (event) => {
        $('#player-overlay').style.display = 'none'

        if (activeCategory && unplayedSongs(activeCategory).length == 0) {
            $(`#${activeCategory}-tile`).style.background = 'grey'
        }

        setActiveCategory(null)
        setActiveSong(null)
    }

    let PlayerToggle = () => {
        if (!activeSong) {
            return (
                <div>Loading...</div>
            )
        } else {
            let guessDuration = game.defaultDuration
            if (activeSong.duration) {
                guessDuration = activeSong.duration
            }
            return (
                <MusicPlayer song={activeSong} time={guessDuration} onClose={closeOverlay} />
            )
        }
    }

    if (!haveGame) {
        return (
            <div>loading...</div>
        )
    } else {
        console.log('game screen rerender')
        let categories = game.music.map(cat => cat.name)
        return (
            <div className='shell'>
                <CategoryGrid categories={categories} selectFunc={selectCategory} />
                <Teams />
                <div id='player-overlay' onClick={closeOverlay}>
                    {PlayerToggle()}
                </div>
            </div>
        )
    }
}

function CategoryGrid(props) {
    let catNames = props.categories
    //give the categories random colors

    let CategoryTiles = catNames.map((catName) => { 
        return (
            <CategoryTile title={catName} selectFunc={props.selectFunc} />
        )
    })

    return (
        <>
        <div class='category-tiles-flexbox border-2'>
            {CategoryTiles}
        </div>
        </>
    )
}

function CategoryTile(props) {
    let remaining = unplayedSongs(props.title).length
    let id = props.title + '-tile'
    let labelText = `${props.title} -- ${remaining}`

    // when you click on a category tile, send the category title to the function passed down
    //   this will open the overlay and play the song
    let playSong = (e) => {
        if (remaining <= 0) {
            return
        }
        props.selectFunc(props.title)
    }

    return (
        <div id={id} class='category-tile-flex-item border-1' onClick={playSong}>
            {labelText}
        </div>
    )
}

function Teams() {
    let TeamColumns = Object.entries(teams).map(([name, players]) => {
        let [score, setScore] = useState(0)
        return (
            <div class='team-container'>
                <div class='team-info border-1'>
                    <div class='team-label'>{name}</div>
                    <PlayerList players={players} />
                </div>
                <div class='team-score border-2'>
                    <input type='button' class='plus-button' value='+' 
                        onClick={e => setScore(score + 1)} />
                    <div class='score-label'>{score}</div>
                    <input type='button' class='minus-button' value='-' 
                        onClick={e => setScore(Math.max(0, score - 1))} />
                </div>
            </div>
        )
    })

    return (
        <div class='center-content'>
            <div class='teams-zone border-3'>
                {TeamColumns}
            </div>
        </div>
    )
}

function PlayerList(props) {
    let PlayerLabels = props.players.map((player) => {
        return (
            <div class='player-label'>
                {player}
            </div>
        )
    })

    return (
        <div class='team-player-names border-2'>
            {PlayerLabels}
        </div>
    )
}

// claude helped with this one
// a logical maze that starts the countdown, plays the song, and displays the information.
//   i shudder at how readable it will be when i start to add css decoration
function MusicPlayer(props) {
    const [guessTimer, setGuessTimer] = useState(props.time)
    const [songRevealed, setSongRevealed] = useState(false)
    const [songPlaying, setSongPlaying] = useState(true)
    const [countdown, setCountdown] = useState(game.countdown)
    const [songFile, setSongFile] = useState('')
    const audioRef = useRef(null)

    useEffect(async () => {
        if (!songPlaying || songRevealed) {
            return
        }

        if (guessTimer <= 0) {
            // setSongPlaying(false)
            setSongRevealed(true)
            return
        }

        let timer = setTimeout(() => {
            if (countdown >= 0) {
                setCountdown(time => time - .1)
            } else {
                setGuessTimer(time => time - .1)
            }
        }, 100);
    }, [countdown, guessTimer, songPlaying, songRevealed]) //when countdown, ticking, or songRevealed change, run this

    useEffect(async () => {
        console.log('[T] songPlaying was triggered, so im going to....')
        let audio = audioRef.current
        let songUri = createSongUri(props.song)
        setSongFile(songUri)
        if (countdown <= 0 && songPlaying) {
            audio.play() //;console.log('[T] play a song')
        } else {
            audio.pause() //;console.log('[T] the song is over or paused')
        }
    }, [countdown, songPlaying]) //when songPlaying or pre changes, run this

    return (
        <div class='border-2' style="margin: 20%;" onclick={e => e.stopPropagation()}>
            <div class="">{countdown.toFixed(1)}</div>
            <div class="">{guessTimer.toFixed(1)}</div>
            <audio ref={audioRef} src={songFile} controls/>
            <input type='button' value='play/pause' onClick={e => setSongPlaying(!songPlaying)} />
            <SongInfo songRevealed={songRevealed} song={props.song} />
        </div>
    )
}

function SongInfo(props) {
    let [autoReveal, setAutoReveal] = useState(game.autoReveal)

    let InfoBlock = () => {
        if (game.style == 'game') {
            return (
                <div>
                    <div>Title: {props.song.title}</div>
                    <div>Composer: {props.song.composer}</div>
                    <div>Game: {props.song.game}</div>
                    <div>Release Year: {props.song.year}</div>
                </div>
            )
        } else if (game.style == 'music') {
            return (
                <div>
                    <div>Artist: {props.song.artist}</div>
                    <div>Album: {props.song.album}</div>
                    <div>Game: {props.song.game}</div>
                    <div>Release Year: {props.song.year}</div>
                </div>
            )
        } else {
            return (
                <div>
                    <div>Title: {props.song.title}</div>
                    <div>Artist: {props.song.artist}</div>
                    <div>Composer: {props.song.composer}</div>
                    <div>Album: {props.song.album}</div>
                    <div>Game: {props.song.game}</div>
                    <div>Release Year: {props.song.year}</div>
                </div>
            )
        }
    }

    if (props.songRevealed && autoReveal) {
        return InfoBlock()
    } else {
        if (!autoReveal) {
            return (
                <input type='button' value='reveal' onClick={e => setAutoReveal(true)} />
            )
        } else {
            return (<div></div>)
        }
    }
}

function unplayedSongs(category) {
    if (game == null || game.music == null ||category == null || category == "")
        return
    let cat = game.music.filter(cat => cat.name == category)[0]
    return cat.songs.filter(song => !song.played)
}

function defaultTeams() {
    let teams = "east side,west side"
    let players = 'east side|||notorious B.I.G.,east side|||puff daddy,west side|||2Pac,west side|||dr dre'
    return [teams,players]
}

function createSongUri(song) {
    let minAt = Math.floor(song.startTime / 60)
    if (minAt < 10) {
        minAt = "0" + minAt
    }
    let secAt = song.startTime % 60
    if (secAt < 10) {
        secAt = "0" + secAt
    }
    let playAt = `t=00:${minAt}:${secAt}`
    return game.songsLocation + "/" + song.soundFile + "#" + playAt
}

export default function() {
    let incomingTeams = localStorage.getItem('teams')
    let incomingPlayers = localStorage.getItem('players')
    if (incomingTeams == '' || incomingPlayers == '') {
        [incomingTeams, incomingPlayers] = defaultTeams()
    }

    incomingTeams.split(',').forEach(t => teams[t] = [])
    incomingPlayers.split(',').forEach(player => {
        let [t, name] = player.split('|||')
        teams[t].push(name)
    })

    // console.log(teams)
    // console.log(players)
    // console.log(gameFolder)
    // let jsonData = getDataFile()
    // console.log('rendering page')
    render(GameScreen(), document.body)
}

//todo: add images
//      css for catagories
//      css for player
//      css for teams
//      animations for categories
//      animations for music player
//      animations for teams
//      game/music industry mode