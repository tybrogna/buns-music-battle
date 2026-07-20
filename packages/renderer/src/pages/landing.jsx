import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { $, $$$, range, defaultFolder } from '../js/helpers.js'
import { process_platform, os_userInfo, fs_readdir, path_join } from '@app/preload'
import { Link, Route, Router } from 'wouter-preact'
import { useHashLocation } from 'wouter-preact/use-hash-location'
import headerLogo from '../../imgs/logo.webp'
// import * as Settings from '../settings.js'
import '../css/landing.css'

import DataViewer from './dataViewer.jsx'
import FileTest from './fileTest.jsx'
import MusicTest from './musicTest.jsx'

function LogoBox(props) {
    return (
        <div id='logo-box'>
            <img class='logo' src={headerLogo} />
        </div>
    )
}

function TeamSetup(props) {
    let [teams, setTeams] = useState(0)

    useEffect(() => {
        let teamsAlreadySetUp = () => {
            let numberOfTeams = 0
            let storedTeams = localStorage.getItem('teams')
            let storedPlayers = localStorage.getItem('players')

            if (storedTeams != null) {
                let teams = storedTeams.split(',')
                numberOfTeams = Math.max(numberOfTeams, teams.length)

            }
            if (storedPlayers != null) {

            }
        }

        if (teams == 0) {
            teamsAlreadySetUp()
        }
    })

    let Teams = range(teams).map(item => {
        return (
            <>
            <input type='text' class='team-name-textbox' placeholder='Team Name...' />
            <textarea rows='6' class='players-textbox' cols='40' placeholder='Participants, one per line...' />
            </>
        )
    })

    return (
        <div id='team-setup-box'>
            <input type='button' value='Add Team' onclick={e => {setTeams(teams + 1)}} />
            <div>
                {Teams}
            </div>
        </div>
    )
}

function GameSelect() {
    let [ gamesFound, setGamesFound ] = useState([])

    let checkFolderForGames = async () => {
        let foundFiles = await fs_readdir($('#folder-location-input').value)
        setGamesFound(foundFiles)
    }

    useEffect(async () => {
        await checkFolderForGames()
    }, [])

    return (
        <>
        <input id='folder-location-input' type='text' defaultValue={defaultFolder()}/>
        <input type="button" value="check for new games" onClick={checkFolderForGames} />
        <select id='game-folder-select'>
            {gamesFound.map((item) => {
                return (
                    <option value={item}>{item}</option>
                )
            })}
        </select>
        </>
    )
}

export default function Landing() {

    return (
        <div id='shell'>
            <LogoBox />
            <TeamSetup />
            <GameSelect />
            <div>
                <Link href='/files'>file viewer</Link>
                <Link style="margin-left: 15px;" href='/file-test'>file test</Link>
                <Link style="margin-left: 15px;" href='/music-test'>music test</Link>
            </div>
            <input type='button' value='Start Game' onclick={e => startGame()}/>
            <Link id='start-game-link' style='display:none;' href='/game'>file viewer</Link>
            {/* <Route path='/files' component={DataViewer} />
            <Route path='/file-test' component={FileTest} />
            <Route path='/music-test' component={MusicTest} /> */}
        </div>
    )
}

async function startGame(event) {
    let nodes = $$$('.team-name-textbox')
    let teams = Array.from(nodes).map(node => { node.value.replace(',', '.') })
    console.log(teams)

    nodes = $$$('.players-textbox')
    let players = Array.from(nodes).map((node, idx) => {
        let splits = node.value.split('\n')
        splits = splits.map(s => {
            let s2 = s.replace(',', '.')
            return teams[idx] + "|||" + s2
        })
        return splits
    })
    console.log(players)

    let gameFolder = $('#game-folder-select').value

    if (gameFolder == '') {
        console.log("you have to select a game to play")
        return
    }

    if (teams.length != players.length) {
        console.log("a team is missing a name or players")
        return
    }

    let gameFolderLocation = await path_join($('#folder-location-input').value, gameFolder)

    console.log(gameFolderLocation)

    localStorage.setItem('gameFolder', gameFolderLocation)
    localStorage.setItem('teams', teams)
    localStorage.setItem('players', players)
    // localStorage.setItem('gameFolder', gameFolder)
    $('#start-game-link').click()
}

// export default () => {
//     return (
//         <Landing />
//     )
// }

//todo: delete the unnecessary setup files
//      splash logo
//      css for buttons
//      animations for buttons