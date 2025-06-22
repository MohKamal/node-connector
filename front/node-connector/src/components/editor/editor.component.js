import { h, Component } from "preact";
import "./editor.css";
import SheetComponent from "../sheet/sheet.component";
import ListComponent from "../list/list.component";

export default class EditorComponent extends Component {
  constructor() {
    super();
    this.state = {
      params: {},
    };
  }

  getParams() {
    // Parse URL parameters when the component mounts
    const params = new URLSearchParams(window.location.search);
    const parsedParams = {};
    params.forEach((value, key) => {
      parsedParams[key] = value;
    });

    // Update the state with the parsed parameters
    this.setState({ params: parsedParams });
  }

  componentDidMount() {
    this.getParams();
  }

  render() {
    const { params } = this.state;

    return (
      <div class="container">
        <div id="main-area" class="main-area">
          {params.id ? <SheetComponent id={params.id} /> : <ListComponent />}
        </div>
      </div>
    );
  }
}
