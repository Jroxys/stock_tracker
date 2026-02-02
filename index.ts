import { bot } from "./bot/bot.js";
import dotenv from 'dotenv/config';
import express from 'express';
import { startStockJob } from "./jobs/stockJob.js";

const app = express();

bot.launch();
startStockJob();

console.log('Bot is running...');

app.get('/', (req, res) => {
    res.send('Stock Tracker Bot is running!');
});