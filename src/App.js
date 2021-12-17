import React from 'react';
import './App.css';

import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
const JoinRoom = React.lazy(() => import('./views/video/joinroom.js'));
const CreateRoom = React.lazy(() => import('./views/video/createroom.js'));

const App = () => {
  return (
    <div className="app">
      {/* <header>
        <h1>Video Chat with Hooks</h1>
      </header> */}
       
      <BrowserRouter>
        <React.Suspense fallback={true}>
          <Switch>
            <Route exact path="/" name="Join Room" render={props => <CreateRoom {...props}/>} />
            <Route exact path="/join-room" name="Join Room" render={props => <JoinRoom {...props}/>} />
          </Switch>
        </React.Suspense>
      </BrowserRouter>     
      {/* <footer>
        <p>
          Made with{' '}
          <span role="img" aria-label="React">
            ⚛️
          </span>{' '}
          by <a href="https://twitter.com/philnash">philnash</a>
        </p>
      </footer> */}
    </div>
  );
};

export default App;
