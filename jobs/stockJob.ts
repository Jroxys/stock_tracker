import cron from "node-cron";
import { prisma } from '../lib/prisma.js';
import { checkStock } from "../service/stockChecker.js";
import { bot } from "../bot/bot.js";
import { sleep } from "../utils/commands.js";

export function startStockJob() {
  let isRunning = false;
  cron.schedule("*/5 * * * *", async () => {
    if (isRunning) return;
    isRunning= true;
    console.log("⏰ Stok kontrol cron çalıştı");

    const watches = await prisma.watch.findMany({
      where: { active: true },
      include: {
        product: true,
        user: true
      }
    });

    for (const watch of watches) {
      try {
        const inStock = await checkStock(watch.product.url);

        await prisma.watch.update({
          where: { id: watch.id },
          data: { lastChecked: new Date() }
        });

        if (inStock) {
          // vildirim gönder
          await bot.telegram.sendMessage(
            watch.user.telegramId,
            `🚀 STOK GELDİ!\n\n${watch.product.url}`
          );

          // takibi kapat
          await prisma.watch.update({
            where: { id: watch.id },
            data: { active: false }
          });
          await sleep(1500);
        }
      } catch (err:any) {
        console.error(`Cron Hata\n\n${watch.product.url}`, err.message , );
        continue;
      }
      finally{
        isRunning=false;
      }
    }
  });
}
