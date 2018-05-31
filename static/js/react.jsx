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
                  collectResponse : '',
                  collectTally : '',
                  multiSelect : '',
                  title : '',
                  prompt : '',
                  shortCode : '',
                  responses : ''
                  };

    }

  getUpdate = (data) => {
    console.log(data);
    this.setState(data);

  }

  componentDidMount() {
    fetch('/api/polls/' + pollId, 
      {
      method: 'GET',
      credentials: 'include'
      })
      .then(resp => resp.json())
      .then( data => this.setState({ pollId : data.poll_id, 
                                     collectResponse : data.collect_response, 
                                     collectTally : data.collect_tally,
                                     multiSelect : data.multi_select,
                                     title : data.title,
                                     prompt : data.prompt,
                                     shortCode : data.short_code,
                                     responses : data.responses
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
        collectResponse={this.state.collectResponse}
        collectTally={this.state.collectTally}
        multiSelect={this.state.multiSelect}
        title={this.state.title}
        prompt={this.state.prompt}
        shortCode={this.state.shortCode}
        responses={this.state.responses}
        cbUpdate={this.getUpdate}
      />
  )}

} // end PollSettings

const Routes = (props) => (
  <div>
    <Route path={ '/' + pollCode } render={ routeProps => <Header routeProps={routeProps} {...props} />} />
    <Route path={ '/' + pollCode } render={ routeProps => <Main routeProps={routeProps} {...props} />} />
  </div>
)

const Main = (props) => {
  const match = props.routeProps.match;
  const cbUpdate = props.cbUpdate;
  console.log(props);

  const AdminRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
      props.isAdmin === true
        ? <Component {...props} />
        : <Redirect to={'/' + pollCode} />
    )} />
  );

  const ConditionalRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
      props.mayRespond === true
        ? <Component {...props} />
        : <Redirect to={'/' + pollCode + '/results'} />
    )} />
  );

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
          <ConditionalRoute key="1" exact path={match.url}
            render={routeProps => <Poll  key="1" pollId={pollId} routeProps={routeProps} mode="respond" {...props}/>} />
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
  if (props.isAdmin === true) {
    return(
      <header>
        <nav>
          <ul>
            <li key="1"><Link to={ match.url } >Respond</Link></li>
            <li key="2"><Link to={ match.url + '/edit' } >Edit</Link></li>
            <li key="3"><Link to={ match.url + '/results' }>Results</Link></li>
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