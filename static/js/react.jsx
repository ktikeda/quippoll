import { BrowserRouter as Router, Route, Redirect, Link, Switch } from 'react-router-dom';

import React from "react";
import ReactDOM from "react-dom";

import Poll from "./Poll.jsx";

class UserSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
                  userId : "",
                  isAdmin: true,
                  mayRespond : true
                  };
    }

  componentDidMount() {
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
      <PollSettings userId={this.state.userId} isAdmin={this.state.isAdmin} mayRespond={this.state.mayRespond} />
  )}

} // end UsersSettings


class PollSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
  } // end componentDidMount
  
  render() {

  // source: https://tylermcginnis.com/react-router-protected-routes-authentication/

    const Main = ({match}) => {
      const AdminRoute = ({ component: Component, ...rest }) => (
        <Route {...rest} render={(props) => (
          this.props.isAdmin === true
            ? <Component {...props} />
            : <Redirect to={'/' + pollCode} />
        )} />
      );

      const ConditionalRoute = ({ component: Component, ...rest }) => (
        <Route {...rest} render={(props) => (
          this.props.mayRespond === true
            ? <Component {...props} />
            : <Redirect to={'/' + pollCode + '/results'} />
        )} />
      );

      if (this.props.isAdmin === true) {
        return(
          <main>
            <Switch>
              <Route exact path={match.url} 
                component={(props) => <Poll id={pollId} mode="respond" {...props}/>} />
              <Route exact path={ match.url + '/edit' } 
                component={(props) => <Poll id={pollId} mode="edit" {...props}/>} />
              <Route exact path={ match.url + '/results' }
                component={(props) => <Poll id={pollId} mode="results" {...props}/>} />
            </Switch>
          </main>
      )} else {
        return(
          <main>
            <Switch>
              <ConditionalRoute exact path={match.url} 
                component={(props) => <Poll id={pollId} mode="respond" {...props}/>} />
              <Route exact path={ match.url + '/edit' } 
                component={() => <Redirect to={'/' + pollCode} />} />
              <Route exact path={ match.url + '/results' }
                component={(props) => <Poll id={pollId} mode="results" {...props}/>} />
            </Switch>
          </main>
      )}
    } // end main

    // The Header creates links that can be used to navigate
    // between routes.
    const Header = ({match}) => {
      if (this.props.isAdmin === true) {
        return(
          <header>
            <nav>
              <ul>
                <li><Link to={ match.url } >Respond</Link></li>
                <li><Link to={ match.url + '/edit' } >Edit</Link></li>
                <li><Link to={ match.url + '/results' }>Results</Link></li>
              </ul>
            </nav>
          </header>
      )} else {
          return(<header />)
      }
    } // end Header


    return(
      <div>
        <Route path={ '/' + pollCode } render={ props => <Header {...props} isAdmin={true} />} />
        <Route path={ '/' + pollCode } render={ props => <Main {...props} isAdmin={true} mayRespond={true}/>} />
      </div>
  )} // end render
} //end app

/* routes-end */

/* main-start */

const content = document.getElementById('root');
const pollId = content.dataset.poll;
const pollCode = content.dataset.code;
console.log(pollCode);

// add flag, document.cookie.isadmin in vanilla js
ReactDOM.render(
  <Router>
    <UserSettings />
  </Router>,
    document.getElementById("root")
);
/* main-end */