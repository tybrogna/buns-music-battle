import { render } from 'preact'
// import * as Settings from '../settings.js'
import { useState, useEffect, useRef } from 'preact/hooks'
import { Link, Route } from 'wouter-preact'
import { $, $$$, delay, range, Song, shuffle } from '../js/helpers.js'
import { fs_readdir, fs_readFile, fs_readMp3, fs_writeFile, path_join, path_normalize } from '@app/preload'

import '../css/game.css'

let teams = {}
let game = {}


function GameScreen() {
    let [haveGame, setHaveGame] = useState(false)
    let [activeCategory, setActiveCategory] = useState(null)
    let [activeSong, setActiveSong] = useState(null)

    useEffect(async () => {
        let selectedGameFolder = localStorage.getItem('gameFolder')
        let filesInFolder = await fs_readdir(selectedGameFolder)
        let jsonFileLoc = filesInFolder.filter(item => item.endsWith('.json'))[0]  // first json file in folder
        let jsonPath = await path_join(selectedGameFolder, jsonFileLoc)
        let jsonData = await fs_readFile(jsonPath)
        jsonData = await JSON.parse(new TextDecoder().decode(jsonData))
        Object.entries(jsonData.music).forEach(([key, val]) => {
            val.songs.forEach(song => song.played = false)
        })
        game = jsonData
        game.songsLocation = await path_join(selectedGameFolder, 'songs')
        game.albumsLocation = await path_join(selectedGameFolder, 'albums')
        game.backgroundsLocation = await path_join(selectedGameFolder, 'bgs')
        game.music.forEach((category, idx) => {
            category['id'] = 'c' + idx
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
            $(`#${activeCategory}`).style.background = 'grey'
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
        // let categories = game.music.map(cat => [cat.name, cat.tileImg])
        return (
            <div className='shell'>
                {/* <Background /> */}
                <CategoryGrid categories={game.music} selectFunc={selectCategory} />
                <Teams />
                <div id='player-overlay' onClick={closeOverlay}>
                    <PlayerToggle />
                </div>
                <div id='back-box'>
                    <Link href='/'>&#8592; // To Title</Link>
                </div>
            </div>
        )
    }
}

function Background() {
    return (
        <div class='background-overlay'>

        </div>
    )
}

function CategoryGrid(props) {
    // let catego = props.categories
    //give the categories random colors

    let CategoryTiles = () => props.categories.map(cat => {
        return (
            <CategoryTile category={cat} selectFunc={props.selectFunc} />
        )
    })


    return (
        <>
        <div class='category-tiles-flexbox border-2'>
            <CategoryTiles />
        </div>
        </>
    )
}

function CategoryTile(props) {
    let [ bgUrl, setBgUrl ] = useState('')
    let remaining = unplayedSongs(props.category.id).length
    let labelText = `${props.category.name} -- ${remaining}`

    useEffect(async () => {
        let bgLocation = await path_join(game.backgroundsLocation, props.category.tileImg)
        bgLocation = 'background-image: url(asset:///' + bgLocation + ')'
        setBgUrl(bgLocation)
    })

    let createBackgroundUrl = async () => {
        // let bgLocation = game.backgroundsLocation + '\\' + props.category.tileImg
    }

    // when you click on a category tile, send the category title to the function passed down
    //   this will open the overlay and play the song
    let playSong = (e) => {
        if (remaining <= 0) {
            return
        }
        props.selectFunc(props.category.id)
    }

    let categoryTileClasses = ""
    if (game.music.length <= 4) {
        categoryTileClasses = "category-tile category-tile-4"
    } else if (game.music.length <= 8) {
        categoryTileClasses = "category-tile category-tile-8"
    } else {
        categoryTileClasses = "category-tile category-tile-12"
    }

    return (
        <div id={props.category.id} class={categoryTileClasses} style={bgUrl} onClick={playSong} >
            <div class='category-tile-floating-name'>{props.category.name}</div>
            <div class='category-tile-floating-count'>{remaining} Left</div>
        </div>
    )
}

function Teams() {
    let TeamColumns = () => //doozy of a one liner
        Object.entries(teams).map(([name, players]) => {
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
                <TeamColumns />
            </div>
        </div>
    )
}

function PlayerList(props) {
    let PlayerLabels = () => 
        props.players.map((player) => {
            return (
                <div class='player-label'>
                    {player}
                </div>
            )
        })

    return (
        <div class='team-player-names border-2'>
            <PlayerLabels />
        </div>
    )
}

// claude helped with this one
// a logical maze that starts the countdown, plays the song, and displays the information.
//   i shudder at how readable it will be when i start to add css decoration
function MusicPlayer(props) {
    let initGuessTime = parseInt(props.time)
    let initCountdownTime = parseInt(game.countdown)
    let initalFullTime = initGuessTime + initCountdownTime
    const [displayTime, setDisplayTime] = useState(initalFullTime)
    const [fullTimer, setFullTimer] = useState(initalFullTime)

    const [guessTimer, setGuessTimer] = useState(initGuessTime)
    const [songRevealed, setSongRevealed] = useState(false)
    const [songPlaying, setSongPlaying] = useState(true)
    const [countdown, setCountdown] = useState(parseInt(game.countdown))
    const [fileWasLoaded, setFileWasLoaded] = useState(false)
    const audioRef = useRef(null)

    useEffect(async () => {
        if (!songPlaying || songRevealed) {
            return
        }

        if (fullTimer <= 0) {
            // setSongPlaying(false)
            setSongRevealed(true)
            return
        }

        let timer = setTimeout(() => {
            setFullTimer(time => time - .1)
            let svg = $('.timer').querySelector('svg > circle + circle')
            if (fullTimer >= initGuessTime) {
                let newTime = Math.min(0, (fullTimer - initGuessTime) * -1)
                setDisplayTime(newTime)
                let strokePercentage = (fullTimer - initGuessTime) / initCountdownTime
                svg.style.strokeDashoffset = strokePercentage
            } else {
                setDisplayTime(fullTimer)
                let svg = document.querySelector('.timer')
                            .querySelector('svg > circle + circle')
                let strokePercentage = (initGuessTime - fullTimer) / initGuessTime
                svg.style.strokeDashoffset = Math.max(0, strokePercentage)
            }

            // if (countdown >= 0) {
            //     setCountdown(time => time - .1)
            // } else {
            //     setGuessTimer(time => time - .1)
            //     let svg = document.querySelector('.timer')
            //                 .querySelector('svg > circle + circle')
            //     let strokePercentage = (startingTime - guessTimer) / startingTime
            //     svg.style.strokeDashoffset = strokePercentage
            // }
        }, 100);
    // }, [countdown, guessTimer, songPlaying, songRevealed]) //when countdown, ticking, or songRevealed change, run this
    }, [fullTimer, songPlaying, songRevealed]) //when countdown, ticking, or songRevealed change, run this

    useEffect(async () => {
        console.log('[T] songPlaying was triggered, so im going to....')
        let audio = audioRef.current
        // console.log(audio)
        if (!fileWasLoaded) {
            let songLocation = await path_join(game.songsLocation, props.song.soundFile)
            let songBytes = await fs_readMp3(songLocation)
            audio.src = songBytes
            audio.currentTime = props.song.startTime
            setFileWasLoaded(true)
            console.log('file loaded!!')
        }
        // let songUri = await createSongUri(props.song)
        // setSongFile(songUri)
        // if (countdown <= 0 && songPlaying) {
        if (fullTimer <= initGuessTime && songPlaying) {
            audio.play() //;console.log('[T] play a song')
        } else {
            audio.pause() //;console.log('[T] the song is over or paused')
        }
    }, [fullTimer, songPlaying]) //when songPlaying or pre changes, run this

    return (
        <div class='music-player border-1' onclick={e => e.stopPropagation()}>
            {/* <div>{displayTime.toFixed(1)}</div>
            <div>{countdown.toFixed(1)}</div> */}
            <audio ref={audioRef} src=''/>
            <div class="timer animatable border-2">
                <svg>
                    <circle cx="50%" cy="50%" r="235"/>
                    <circle cx="50%" cy="50%" r="235" pathLength="1" />
                    <text x="50%" y="50%" text-anchor="middle"><tspan id="timeLeft">{displayTime.toFixed(0)}</tspan></text>
                    <foreignObject x="48%" y="60%" width="75" height="50">
                        <input style='height: 40px' type='button' value='pause' onClick={e => setSongPlaying(!songPlaying) } />
                    </foreignObject>
                </svg>
            </div>
            <SongInfo songRevealed={songRevealed} song={props.song} />
        </div>
    )

    // return (
    //     <div class='border-2' style="margin: 20%;" onclick={e => e.stopPropagation()}>
    //         <div class="">{countdown.toFixed(1)}</div>
    //         <div class="">{guessTimer.toFixed(1)}</div>
    //         <audio ref={audioRef} src='' controls/>
    //         <input type='button' value='play/pause' onClick={e => setSongPlaying(!songPlaying)} />
    //         <SongInfo songRevealed={songRevealed} song={props.song} />
    //     </div>
    // )
}

function SongInfo(props) {
    let [autoReveal, setAutoReveal] = useState(game.autoReveal)

    let InfoBlock = () => {
        if (game.style == 'game') {
            // return (
            //     <div class='song-info'>
            //         <div>Title: {props.song.title}</div>
            //         <div>Composer: {props.song.composer}</div>
            //         <div>Game: {props.song.game}</div>
            //         <div>Release Year: {props.song.year}</div>
            //     </div>
            // )
            return (
                <table class='song-info'>
                    <tr>
                        <td>Title:</td>
                        <td>{props.song.title}</td>
                    </tr>
                    <tr>
                        <td>Composer:</td>
                        <td>{props.song.composer}</td>
                    </tr>
                    <tr>
                        <td>Game:</td>
                        <td>{props.song.game}</td>
                    </tr>
                    <tr>
                        <td>Release Year:</td>
                        <td>{props.song.year}</td>
                    </tr>
                </table>
            )
        } else if (game.style == 'music') {
            return (
                <div class='song-info'>
                    <div>Artist: {props.song.artist}</div>
                    <div>Album: {props.song.album}</div>
                    <div>Game: {props.song.game}</div>
                    <div>Release Year: {props.song.year}</div>
                </div>
            )
        } else {
            return (
                <div class='song-info'>
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
        return <InfoBlock />
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
    if (game == null || game.music == null || category == null || category == "")
        return
    let cat = game.music.filter(cat => cat.id == category)[0]
    return cat.songs.filter(song => !song.played)
}

function defaultTeams() {
    let teams = "east side,west side"
    let players = 'east side|||notorious B.I.G.,east side|||puff daddy,west side|||2Pac,west side|||dr dre'
    return [teams,players]
}

// previous function for streaming songs
// async function createSongUri(song) {
//     let minAt = Math.floor(song.startTime / 60)
//     if (minAt < 10) {
//         minAt = "0" + minAt
//     }
//     let secAt = song.startTime % 60
//     if (secAt < 10) {
//         secAt = "0" + secAt
//     }
//     let playAt = `t=00:${minAt}:${secAt}`
//     let uri = await path_join(game.songsLocation, song.soundFile)
//     uri += "#" + playAt
//     console.log(uri)
//     return uri
// }

export default function Game() {
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
    return <GameScreen />
}

//todo: add images
//      css for catagories
//      css for player
//      css for teams
//      animations for categories
//      animations for music player
//      animations for teams
//      game/music industry mode