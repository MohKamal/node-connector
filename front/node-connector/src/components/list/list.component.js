import { h, Component } from "preact";
import "./list.css";
import DataService from "./../../services/data.service";

export default class ListComponent extends Component {
  constructor() {
    super();
    this.api = new DataService();
    this.state = {
      name: "",
      error: "",
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  componentDidMount() {
    this.renderProjects();
    const modal = document.getElementById("modal");
    if (modal) {
      window.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });
    }
  }

  // Function to render the project list
  renderProjects() {
    this.api
      .getSheetsList()
      .then((res) => res.json())
      .then((sheets) => {
        const projectList = document.getElementById("project-list");
        if (!projectList) return;
        // Clear existing content
        projectList.innerHTML = "";

        // Generate list items for each project
        sheets.forEach((sheet) => {
          const listItem = document.createElement("li");
          const link = document.createElement("a");

          // Set link attributes
          link.href = `/editor?id=${sheet.uid}`;
          link.textContent = sheet.name;
          link.addEventListener("click", (e) => {
            window.location.href = `/editor?id=${sheet.uid}`;
          });
          // Append link to list item
          listItem.appendChild(link);

          // Append list item to the project list
          projectList.appendChild(listItem);
        });
      });
  }

  openNewModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;
    modal.style.display = "flex";
  }

  closeNewModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;
    modal.style.display = "none";
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { name } = this.state;
    try {
      let sheet = null;
      await this.api
        .createNewSheet(name)
        .then((res) => res.json())
        .then((_sheet) => {
          sheet = _sheet;
        });
      if (!sheet)
        this.setState({ error: "Error while creating the new sheet" });
      else this.closeNewModal();

      this.renderProjects();
    } catch (err) {
      this.setState({ error: "Error while creating the new sheet" });
    }
  };

  render() {
    return (
      <div class="list-container">
        <h1>My Sheets</h1>
        <ul>
          <li class="new-link">
            <a href="#" onClick={this.openNewModal}>
              Create new
            </a>
          </li>
        </ul>
        <ul id="project-list"></ul>

        <div id="modal" class="modal">
          <div class="modal-content">
            <span class="close" onClick={this.closeNewModal}>
              &times;
            </span>
            <h2>Create New Sheet</h2>
            <form id="projectForm" onSubmit={this.handleSubmit}>
              <label for="projectName">Sheet Name:</label>
              <input
                type="text"
                id="projectName"
                onChange={this.handleChange}
                name="name"
                placeholder="Enter sheet name..."
                required
              />
              {this.state.error && <p id="error-message">{this.state.error}</p>}
              <button type="submit" class="submit-btn">
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
