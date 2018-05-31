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
      <RouteSettings 
        userId={this.state.userId} 
        isAdmin={this.state.isAdmin} 
        mayRespond={this.state.mayRespond} 
        pollId={this.state.pollId}
        collectResponse={this.state.collectResponse}
        collectTally={this.state.collectTally}
        multiSelect={this.state.multiSelect}
        title={this.state.title}
        prompt={this.state.prompt}
        shortCode={this.state.shortCode}
        responses={this.state.responses}
      />
  )}

} // end PollSettings


class RouteSettings extends React.Component {
  constructor(props) {
    super(props);
  }
  
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
                render={() => <Poll mode="respond" {...this.props}/>} />
              <Route exact path={ match.url + '/edit' } 
                render={() => <Poll mode="edit" cbUpdate={this.getUpdate} {...this.props}/>} />
              <Route exact path={ match.url + '/results' }
                render={() => <Poll mode="results" {...this.props}/>} />
            </Switch>
          </main>
      )} else {
        return(
          <main>
            <Switch>
              <ConditionalRoute exact path={match.url} 
                render={() => <Poll mode="respond" {...this.props}/>} />
              <Route exact path={ match.url + '/edit' } 
                render={() => <Redirect to={'/' + pollCode} />} />
              <Route exact path={ match.url + '/results' }
                render={() => <Poll mode="results" {...this.props}/>} />
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
        <Route path={ '/' + pollCode } render={ props => <Header {...props} />} />
        <Route path={ '/' + pollCode } render={ props => <Main {...props} />} />
      </div>
  )} // end render
} //end Route Settings

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