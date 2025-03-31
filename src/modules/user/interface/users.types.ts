export interface SignUpBody {
  username: string;
  email: string;
  password: string;
}
export interface resetPassword {
  email: string;
  password: string;
}
export type SignInBody = {
  email: string;
  password: string;
};
