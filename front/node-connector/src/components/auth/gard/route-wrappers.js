// src/components/RouteWrappers.js
import { h } from "preact";
import AuthService from "./../../../services/auth.service";
import LoginComponent from "./../login/login.component";
import EditorComponent from "./../../editor/editor.component";

const authService = new AuthService();

// Private Route (only for logged-in users)
export const PrivateRoute = ({ component: Component }) => {
  if (!authService.isAuthenticated()) {
    window.location.href = "/login";
    return  <LoginComponent />;
  }
  return <Component />;
};

// Guest Only Route (only for non-logged-in users)
export const GuestOnlyRoute = ({ component: Component }) => {
  if (authService.isAuthenticated()) {
    window.location.href = "/editor";
    // route("/editor", true);
    return <EditorComponent />;
  }
  return <Component />;
};
