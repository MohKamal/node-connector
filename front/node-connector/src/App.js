import { h, Component } from "preact";
import Router from "preact-router";
import LoginComponent from "./components/auth/login/login.component";
import Registeromponent from "./components/auth/register/register.component";
import EditorComponent from "./components/editor/editor.component";
import { PrivateRoute, GuestOnlyRoute } from './components/auth/gard/route-wrappers';

class App extends Component {
  render() {
    return (
      <Router>
        <GuestOnlyRoute path="/login" component={LoginComponent} />
        <GuestOnlyRoute path="/" component={LoginComponent} />
        <GuestOnlyRoute path="/register" component={Registeromponent} />
        <PrivateRoute path="/editor" component={EditorComponent} />
      </Router>
    );
  }
}

export default App;
