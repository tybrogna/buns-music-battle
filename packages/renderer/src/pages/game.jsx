import { render } from 'preact'
// import * as Settings from '../settings.js'
import { useState, useEffect, useRef } from 'preact/hooks'
import { Link, Route } from 'wouter-preact'
import { $, $$$, delay, range, Song, shuffle, loadAsset } from '../js/helpers.js'
import { fs_readdir, fs_readFile, fs_readMp3, fs_writeFile, path_join, path_normalize } from '@app/preload'
import { FastAverageColor } from 'fast-average-color'

import '../css/basic.css'
import '../css/game.css'

let teams = {}
let game = {}

let backupColors = ['FFDE0E','B30638','0B55B7','5F3DC4','782CC3',
    'F3F3F3','00473E','02594C','02A78B','73E6C2',]
let backupCount = 0

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
        <div class='category-tiles-flexbox'>
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
        let asset = await loadAsset(game.backgroundsLocation,
            props.category.tileImg,
            props.category.name)

        if (asset == null) { // backup
            setBgUrl(`background: #${backupColors[backupCount % 10]};`)
            backupCount ++
            return
        }

        setBgUrl(`background-image: url(asset:///${asset})`)
    })

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
        Object.entries(teams).map(([name, players], idx) => {
            let Left = () => { if (idx != 0) return <div class='team-divider'></div> }

            let [score, setScore] = useState(0)

            let plusClicked = (e) => {
                setScore(score + 1)
                e.target.classList.remove('plus-animation')
                setTimeout(() => e.target.classList.add('plus-animation'), 0)
            }

            let minusClicked = (e) => {
                setScore(Math.max(0, score - 1))
                let coords = range(9).map(v =>
                    `${Math.random() * 10 - 5}px, ${Math.random() * 20 - 10}px`
                )
                setTimeout(() => e.target.previousSibling.firstChild.animate([
                    {transform: 'translate(0px,0px)'},
                    {transform: `translate(${coords[0]})`, easing: 'steps(1)', offset: .1},
                    {transform: `translate(${coords[1]})`, easing: 'steps(1)', offset: .2},
                    {transform: `translate(${coords[2]})`, easing: 'steps(1)', offset: .3},
                    {transform: `translate(${coords[3]})`, easing: 'steps(1)', offset: .4},
                    {transform: `translate(${coords[4]})`, easing: 'steps(1)', offset: .5},
                    {transform: `translate(${coords[5]})`, easing: 'steps(1)', offset: .6},
                    {transform: `translate(${coords[6]})`, easing: 'steps(1)', offset: .7},
                    {transform: `translate(${coords[7]})`, easing: 'steps(1)', offset: .8},
                    {transform: `translate(${coords[8]})`, easing: 'steps(1)', offset: .9},
                    {transform: 'translate(0px,0px)'}
                ], 250))
            }

            return (
                <>
                <Left />
                <div class='team-container'>
                    <div class='team-label'>{name}</div>
                    <div class='team-players-and-score'>
                        <div class='team-players'>
                            <PlayerList players={players} />
                        </div>
                        <div class='team-score'>
                            <input type='button' class='game-button button-shadow-dark plus-button' value='+'
                                onClick={plusClicked} />
                            <div class='score-label'>{score}</div>
                            <input type='button' class='game-button button-shadow-dark minus-button' value='-'
                                onClick={minusClicked} />
                        </div>
                    </div>
                </div>
                </>
            )
        })

    return (
        <div class='center-content'>
            <div class='teams-zone'>
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
        <div class=''>
            <div class=''>
                <PlayerLabels />
            </div>
        </div>
    )
}

// claude helped with this one
// a logical maze that starts the countdown, plays the song, and displays the information.
//   i shudder at how readable it will be when i start to add css decoration
function MusicPlayer(props) {
    let initGuessTime = parseInt(props.time)
    let initCountdownTime = parseInt(game.countdown - 1)
    let initalFullTime = initGuessTime + initCountdownTime
    const [displayTime, setDisplayTime] = useState(initalFullTime)
    const [fullTimer, setFullTimer] = useState(initalFullTime)
    const [songRevealed, setSongRevealed] = useState(false)
    const [songPlaying, setSongPlaying] = useState(true)
    const [fileWasLoaded, setFileWasLoaded] = useState(false)
    const [backgroundStyle, setBackgroundStyle] = useState('')
    const audioRef = useRef(null)

    useEffect(async () => {
        if (songRevealed) {
            if (fullTimer > 0) {
                setFullTimer(0)
            }
            $('.timer').classList.remove('animatable')
            $('.timer').classList.add('timer-disappear')
            $('.floating-bg').classList.add('floating-bg-appear')
            console.log('im revealed')
            let lowerVol = setInterval(() => {
                if (audioRef.current == null) {
                    clearInterval(lowerVol)
                    return
                }
                if (audioRef.current.volume > .5) {
                    audioRef.current.volume -= .05
                }
            }, 400)
            return
        }

        if (!songPlaying) {
            return
        }

        if (fullTimer <= 0) {
            setSongRevealed(true)
            return
        }

        let timer = setTimeout(() => {
            setFullTimer(time => time - .1)
            let svg = $('.timer').querySelector('svg > circle + circle')
            if (songRevealed) return
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
        }, 100);
    }, [fullTimer, songPlaying, songRevealed]) //when countdown, ticking, or songRevealed change, run this

    useEffect(async () => {
        // console.log('[T] songPlaying was triggered, so im going to....')
        let audio = audioRef.current
        if (!fileWasLoaded) {
            let asset = await loadAsset(game.songsLocation, props.song.soundFile, props.song.title)
            if (asset == null) {
                console.log('big problems'); return
            }
            let songBytes = await fs_readMp3(asset)
            audio.src = songBytes
            audio.currentTime = props.song.startTime
            setFileWasLoaded(true)
            console.log('file loaded!!')
        }
        if (fullTimer <= initGuessTime && songPlaying) {
            audio.play() //;console.log('[T] play a song')
        } else {
            audio.pause() //;console.log('[T] the song is over or paused')
        }
    }, [fullTimer, songPlaying]) //when songPlaying or pre changes, run this

    useEffect(async () => {
        $('.timer').addEventListener('transitionend', (e) => {
            if (e.target.classList.contains('timer')) {
                e.target.style.display = 'none'
            }
        })

        let asset = await loadAsset(game.backgroundsLocation,
            props.song.backgroundImg,
            props.song.title)
        if (asset == null) {
            return
        }
        setBackgroundStyle(`background-image: url(asset:///${asset})`)
    }, [])

    return (
        <div class='music-player border-1' onclick={e => e.stopPropagation()}>
            <audio ref={audioRef} src=''/>
            <div class="timer animatable border-2">
                <svg>
                    <circle cx="50%" cy="50%" r="235"/>
                    <circle cx="50%" cy="50%" r="235" pathLength="1" />
                    <text x="50%" y="50%" text-anchor="middle"><tspan id="timeLeft">{displayTime.toFixed(0)}</tspan></text>
                    <foreignObject  x="48%" y="60%" width="75" height="50">
                        <input style='height: 40px' class='game-button button-shadow-light' type='button' value='reveal' onClick={e => setSongRevealed(true) } />
                    </foreignObject>
                </svg>
            </div>
            <SongInfo songRevealed={songRevealed} song={props.song} />
            <div class='flex-center'>
                <input class='game-button button-shadow-light pause-button' type='button' value='pause' onClick={e => setSongPlaying(!songPlaying) } />
            </div>
            <div class='floating-bg' style={backgroundStyle}></div>
        </div>
    )
}

function SongInfo(props) {
    let [autoReveal, setAutoReveal] = useState(game.autoReveal)
    let [albumArt, setAlbumArt] = useState('')
    let [albumArtStyle, setAlbumArtStyle] = useState('')

    let infoArr = []
    if (game.style == 'game') {
        infoArr.push(["Title", props.song.title],
            ["Composer", props.song.composer],
            ["Game", props.song.game, 'ita'],
            ["Release Year", props.song.year])
    } else if (game.style == 'music') {
        infoArr.push(["Title", props.song.title],
            ["Artist", props.song.artist],
            ["Album", props.song.album, 'ita'],
            ["Release Year", props.song.year])
    } else {
        infoArr.push(["Title", props.song.title],
            ["Artist", props.song.artist],
            ["Composer", props.song.composer],
            ["Album", props.song.album, 'ita'],
            ["Game", props.song.game],
            ["Release Year", props.song.year])
    }

    let NewInfoBlock = () => infoArr.map(info => {
        return (
            <tr>
                <td>{info[0]}:</td>
                <td class={info[2]}>{info[1]}</td>
            </tr>
        )
    })

    useEffect(async () => {
        let asset = await loadAsset(game.albumsLocation,
            props.song.albumArtImg,
            props.song.title)
        if (asset == null) {
            return
        }
        let assetUrl = 'asset:///' + asset
        let fastAvgColor = await (new FastAverageColor()).getColorAsync(assetUrl)
        let shadowStyle = `filter: drop-shadow(0 0 2rem ${fastAvgColor.rgb})`
        setAlbumArt(assetUrl)
        setAlbumArtStyle(shadowStyle)
    }, [])

    if (props.songRevealed) {
        $('.song-info').style.opacity = '1'
    }

    return (
        // <div class='song-info flex-center opaque' style={background}>
        <div class='song-info flex-center' style='opacity: 0;'>
            <img src={albumArt} style={albumArtStyle} />
            <table >
                <thead style='display:none;'>
                    <tr></tr>
                </thead>
                <tbody>
                    <NewInfoBlock />
                </tbody>
                <tfoot style='display:none;'>
                    <tr></tr>
                </tfoot>
            </table>
        </div>
    )
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

    Object.values(teams).forEach(team => {
        team.sort((a,b) => a.length - b.length)
    })

    // console.log(teams)
    // console.log(players)
    // console.log(gameFolder)
    // let jsonData = getDataFile()
    // console.log('rendering page')
    return <GameScreen />
}

//todo: add images
//      css for catagories DONE
//      css for player - in progress...
//      css for teams
//      animations for categories DONE
//      animations for music player - in progress...
//      animations for teams
//      game/music industry mode DONE