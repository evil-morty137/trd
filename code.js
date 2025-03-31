const { ethers } = require('ethers');
const { abi: IUniswapV2RouterABI } = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json');

const INFURA_URL = "https://mainnet.infura.io/v3/1d204e42068e4c0587c106eb2ee9ac24";
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router

(async () => {
  const provider = new ethers.JsonRpcProvider(INFURA_URL);
  const wallet = new ethers.Wallet("0xc4cdfe6014bde85dd0d3c2906d23e0b587981ced669797a3ce5a304eaba852b3", provider);

  const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, IUniswapV2RouterABI, wallet);

  const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT token address
  const wethAddress = await router.WETH(); // Wrapped ETH address

  const amountIn = ethers.parseUnits("10", 6); // $10 USDT
  const amountOutMin = 0; // Minimum ETH to receive, set to 0 for simplicity (not recommended in production)
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

  const path = [usdtAddress, wethAddress]; // Swap USDT -> WETH (ETH)
  const to = wallet.address;

  // Approve Uniswap to spend your USDT
  const usdtContract = new ethers.Contract(usdtAddress, ["function approve(address spender, uint256 amount) public returns (bool)"], wallet);
  await usdtContract.approve(UNISWAP_ROUTER_ADDRESS, amountIn);

  console.log("Swapping USDT for ETH...");
  const tx = await router.swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();

  console.log("Swap complete!");
})();
