import { h, Component } from "preact";
import AuthService from "../../../services/auth.service";
import "./login.css";

export default class LoginComponent extends Component {
  constructor() {
    super();
    this.authService = new AuthService();
    this.state = {
      username: "",
      password: "",
      error: "",
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = this.state;
    try {
      await this.authService.login(username, password);
      if (this.authService.isAuthenticated()) window.location.href = "/editor";
      else this.setState({ error: "Login failed" });
    } catch (err) {
      this.setState({ error: "Login failed" });
    }
  };

  render() {
    return (
      <div class="login-wrapper">
        <div class="login-container">
          <h2>🔐 Node Connector</h2>
          <form id="loginForm" onSubmit={this.handleSubmit}>
            <input
              type="text"
              class="login-input"
              id="username"
              name="username"
              placeholder="Username"
              onChange={this.handleChange}
              required
            />
            <input
              type="password"
              id="password"
              class="login-input"
              placeholder="Password"
              name="password"
              onChange={this.handleChange}
              required
            />
            <button class="login-button" type="submit">
              Login
            </button>
            {this.state.error && <p id="error-message">{this.state.error}</p>}
            <p>
              Don't have an account? <a href="/register">Register</a>
            </p>
          </form>
        </div>
      </div>
    );
  }
}
