import { BrowserRouter as Router, Route, Redirect, Link, Switch } from 'react-router-dom';

import React from "react";
import ReactDOM from "react-dom";

import Poll from "./Poll.jsx";

class PollSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
                  userId : '',
                  isAdmin: '',
                  mayRespond : '',
                  pollId : '',
                  pollType: '',
                  collectResponse : '',
                  collectTally : '',
                  multiSelect : '',
                  title : '',
                  prompt : '',
                  shortCode : ''
                  };

    }

  getUpdate = (data) => {
    console.log('updating poll settings on client', data);
    this.setState(data);

    socket.emit('poll_update', 
      {room: pollCode, 
       data: data
      }
    );

  }

  componentWillUnmount() {
    socket.emit('leave', {room: pollCode});
  }

  componentDidMount() {
    socket.emit('join', {room: pollCode});

    onPollUpdate (
      (err, data) => {

        this.setState(data);

      }
    ); // end onResponseCreation

    fetch('/api/polls/' + pollId, 
      {
      method: 'GET',
      credentials: 'include'
      })
      .then(resp => resp.json())
      .then( data => this.setState({ pollId : data.poll_id, 
                                     pollType : data.poll_type,
                                     collectResponse : data.collect_response, 
                                     collectTally : data.collect_tally,
                                     multiSelect : data.multi_select,
                                     title : data.title,
                                     prompt : data.prompt,
                                     shortCode : data.short_code,
                                   }));

    fetch('/api/polls/' + pollId + '/user', 
      {
      method: 'GET',
      credentials: 'include'
      })
      .then(resp => resp.json())
      .then( data => this.setState({ userId : data.user_id, 
                                     isAdmin : data.is_admin, 
                                     mayRespond : data.may_respond }));
 
  } // end componentDidMount

  render() {
    return(
      <Routes
        userId={this.state.userId} 
        isAdmin={this.state.isAdmin} 
        mayRespond={this.state.mayRespond} 
        pollType={this.state.pollType}
        collectResponse={this.state.collectResponse}
        collectTally={this.state.collectTally}
        multiSelect={this.state.multiSelect}
        title={this.state.title}
        prompt={this.state.prompt}
        shortCode={this.state.shortCode}
        cbUpdate={this.getUpdate}
      />
  )}

} // end PollSettings

const Routes = (props) => {
  if (props.userId) {
    return(
    <div>
      <Route path={ '/' + pollCode } render={ routeProps => <Header routeProps={routeProps} {...props} />} />
      <Route path={ '/' + pollCode } render={ routeProps => <Main routeProps={routeProps} {...props} />} />
    </div> );
  } else {
      return(<div/>);
  }
}

const Main = (props) => {
  const match = props.routeProps.match;
  const cbUpdate = props.getUpdate;
  const mayRespond = props.mayRespond;
  const isAdmin = props.isAdmin

  if (props.isAdmin === true) {
    return(
      <main>
        <Switch>
          <Route key="1" exact path={match.url}
            render={routeProps => <Poll  key="1" pollId={pollId} routeProps={routeProps} mode="respond" {...props}/>} />
          <Route key="2" exact path={ match.url + '/edit' }
            render={routeProps => <Poll  key="2" pollId={pollId} routeProps={routeProps} mode="edit" cbUpdate={cbUpdate} {...props}/>} />
          <Route key="3" exact path={ match.url + '/results' }
            render={routeProps => <Poll  key="3" pollId={pollId} routeProps={routeProps} mode="results" {...props}/>} />
        </Switch>
      </main>
  )} else {
    return(
      <main>
        <Switch>
        { props.mayRespond === true
          ? <Route key="1" exact path={match.url}
            render={routeProps => <Poll  key="1" pollId={pollId} routeProps={routeProps} mode="respond" {...props}/>} /> 
          : <Route key="1" exact path={ match.url }
            render={() => <Redirect to={'/' + pollCode + '/results'} />} />
        }
          <Route key="2" exact path={ match.url + '/edit' }
            render={() => <Redirect to={'/' + pollCode} />} />
          <Route key="3" exact path={ match.url + '/results' }
            render={routeProps => <Poll  key="2" pollId={pollId} routeProps={routeProps} mode="results" {...props}/>} />
        </Switch>
      </main>
  )}
} // end main

// The Header creates links that can be used to navigate
// between routes.
const Header = (props) => {
  const match = props.routeProps.match;

  const showSMS = () => {
     return(<div className="alert alert-primary" role="alert">Text "<strong>{pollCode}</strong>" to <strong>(628) 800-0602</strong> to respond.</div>); 
    
  }

  if (props.isAdmin === true) {
    return(
      <header>
        {showSMS()}
        <nav>
          <ul className="list-inline">
            <li key="1" className="list-inline-item"><Link to={ match.url } >Respond</Link></li>
            <li key="2" className="list-inline-item"><Link to={ match.url + '/edit' } >Edit</Link></li>
            <li key="3" className="list-inline-item"><Link to={ match.url + '/results' }>Results</Link></li>
          </ul>
        </nav>
      </header>
  )} else {
      return(<header />)
  }
} // end Header

/* routes-end */

/* main-start */

const content = document.getElementById('root');
const pollId = content.dataset.poll;
const pollCode = content.dataset.code;

// add flag, document.cookie.isadmin in vanilla js
ReactDOM.render(
  <Router>
    <PollSettings />
  </Router>,
    document.getElementById("root")
);
/* main-end */