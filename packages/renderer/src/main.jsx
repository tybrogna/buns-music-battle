import { render } from 'preact'
import { LocationProvider, Router, lazy } from 'preact-iso'


// const FileTest = lazy(() => import('./fileTest.jsx'))
const Landing = lazy(() => import('./pages/landing.jsx'))
const Game = lazy(() => import('./pages/game.jsx'))
const DataViewer = lazy(() => import('./pages/dataViewer.jsx'))
const MusicTest = lazy(() => import('./pages/musicTest.jsx'))

let App = () => (
    <LocationProvider>
        <Router>
            {/* <FileTest path='/' /> */}
            <Landing path='/' />
            <Game path='/game' />
            <DataViewer path='/files' />
            <MusicTest path='/music-test' />
        </Router>
    </LocationProvider>
)

render(App(), document.querySelector('body'))
