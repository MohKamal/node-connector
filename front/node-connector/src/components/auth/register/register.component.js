import { h } from "preact";
import { Component } from "preact";
import AuthService from "../../../services/auth.service";
import "./register.css";

export default class Registeromponent extends Component {
  constructor() {
    super();
    this.authService = new AuthService();
    this.state = {
      username: "",
      password: "",
      confirm_password: "",
      error: "",
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, confirm_password } = this.state;
    if (password !== confirm_password) {
      this.setState({
        error: "The confirme password is not the same as the password",
      });
      return;
    }
    try {
      await this.authService.register(username, password);
    } catch (err) {
      this.setState({ error: "Register failed" });
    }
    this.setState({ error: "Register failed" });
  };

  render() {
    return (
      <div class="register-wrapper">
        <div class="login-container">
          <h2>📝 Create Account</h2>
          <form id="registerForm" onSubmit={this.handleSubmit}>
            <input
              type="text"
              id="username"
              class="register-input"
              name="username"
              placeholder="Username"
              onChange={this.handleChange}
              required
            />
            <input
              type="password"
              class="register-input"
              id="password"
              name="password"
              placeholder="Password"
              onChange={this.handleChange}
              required
            />
            <input
              type="password"
              class="register-input"
              id="confirmPassword"
              name="confirm_password"
              placeholder="Confirm Password"
              onChange={this.handleChange}
              required
            />
            <button class="register-button" type="submit">Register</button>
            {this.state.error && <p id="error-message">{this.state.error}</p>}
          </form>
          <p style="margin-top: 15px; font-size: 14px">
            Already have an account?
            <a href="/login" style="color: #00ffcc; text-decoration: none">
              Login here
            </a>
          </p>
        </div>
      </div>
    );
  }
}
