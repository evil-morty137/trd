import bcrypt from "bcryptjs";
import axios from "axios"; // Import axios here
import { SignInBody, SignUpBody, resetPassword } from "./interface/users.types";
import User, { IUser } from "../../models/user.model";
import { BadRequestException } from "../../utils/service-exception";
import { loginResponse } from "../../utils/login-response";

export default class UserService {
  signUp = async (payload: SignUpBody) => {
    try {
      payload.email = payload.email;
      const user = await User.findOne({ email: payload.email });

      if (user) {
        console.log("Email Already exist");
        throw new BadRequestException("Email Already exist");
      }
      const hashedPassword = await bcrypt.hash(payload.password, 10);
      const userData: Partial<IUser> = {
        username: payload.username,
        email: payload.email,
        password: hashedPassword,
      };
      const users = await User.create(userData);

      // Send welcome email
      // await this.sendWelcomeEmail(payload.email);

      return users;
    } catch (err) {
      console.log(err);
    }
  };
  resetPassword = async (payload: resetPassword) => {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
  };
  private async sendWelcomeEmail(recipientEmail: string) {
    try {
      const response = await axios.post(
        "https://api.mailjet.com/v3.1/send",
        {
          Messages: [
            {
              From: {
                Email: "info@digitalmaxtrd.com", // Replace with your sender email address
                Name: "Felix Doe",
              },
              To: [
                {
                  Email: recipientEmail,
                  Name: "Recipient Name",
                },
              ],
              Subject: "Welcome to Our Platform!",
              TextPart: "Thank you for signing up...",
              // Add other content or use HTMLPart for HTML content
            },
          ],
        },
        {
          auth: {
            username: "f341477b94f91eecdbae951eb8e4d2d2",
            password: "15920d949907e30f24d663f8b4cee4f7",
          },
        }
      );

      console.log("Welcome email sent:", response.data);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  signIn = async (payload: SignInBody) => {
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      throw new BadRequestException("Invalid Creds");
    }

    const validPassword = await bcrypt.compare(payload.password, user.password);
    if (!validPassword) {
      throw new BadRequestException("Invalid Creds");
    }

    return loginResponse(user._id.toString());
  };
}
