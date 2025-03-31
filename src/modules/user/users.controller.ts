import { Request, Response } from "express";
import UserService from "./users.services";
import { loginResponse } from "../../utils/login-response";

export default class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  signUp = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.signUp(req.body);
      // res.cookie('auth', JSON.stringify(result.user), { httpOnly: true });

      res.redirect("/dashboard");
    } catch (error) {
      console.error(error);

      // Handle the error, possibly by redirecting to an error page
      res.redirect("/signup"); // Change "/error" to the desired error page URL
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.signIn(req.body);
      res.cookie("auth", JSON.stringify(result.user), { httpOnly: true });
      res.redirect("/dashboard");
    } catch (error) {
      console.error(error);

      // Handle the error, possibly by redirecting to an error page
      res.redirect("/login"); // Change "/error" to the desired error page URL
    }
  };
}
