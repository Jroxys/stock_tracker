import {Telegraf} from 'telegraf';
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { getUser } from '../utils/commands.js';
import { limit } from "@grammyjs/ratelimiter";
import { checkStock } from "../service/stockChecker.js";

export const bot = new Telegraf(process.env.TELEGRAM_TOKEN as string);


bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || 'NoUsername';

    const user = await prisma.user.upsert({
        where: { telegramId },
        update: { username },
        create: { telegramId, username },
    })

     await ctx.reply(`Stok takip botuna hoş geldin ${username}!\n\n` + 
          `📦 Stokta olmayan ürünleri ekle,\n` +
    `stok gelince haber vereyim.\n\n` +
    `➕ Ürün eklemek için:\n/add <link>`
    )
})

bot.command('add', async (ctx) => {
    const args = ctx.message.text.split(' ') // mesajı boşluklardan ayırıyor
    const url = args[1] // 2. kısmı alıyor eğer 2. kısım yoksa link verilmemiş demektir
    // urller için sonra check ekle (gratis mi trendyol mu cart curt)
    if (!url) {
        await ctx.reply('Lütfen bir ürün linki sağlayın. Örnek: /add <link>')
        return
    }
    // product oluştur
    const product = await prisma.product.upsert({
        where: { url },
        update: {},
        create: { url },
    })
    // kullanıcıyı al
 const user = await getUser(ctx);
    // watch oluştur
    try {
        await prisma.watch.create({
            data : {
                userId : user!.id,
                productId : product.id,
            }
        })
    }
    catch (err:any) {
        if (err.code === "P2002") {
        return ctx.reply("⚠️ Bu ürünü zaten takip ediyorsun");
    }
    }
    await ctx.reply(`Ürün başarıyla eklendi ve takip ediliyor: ${url}`)
})

bot.command('list' , async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user =  await prisma.user.findUnique({
        where: { telegramId },
        include: { watches: { include: { product: true } } }
    })
    if (!user || user.watches.length === 0) {
        await ctx.reply('Henüz takip ettiğiniz bir ürün yok. /add <link> komutuyla ürün ekleyebilirsiniz.')
        return
    }
    let response = 'Takip ettiğiniz ürünler:\n\n';
    for (const watch of user.watches) {
        response += `🔗 ${watch.product.url}\n`;
    }
    await ctx.reply(response);
})

bot.command('remove' , async (ctx) => {
    const args = ctx.message.text.split(' ')
    const url = args[1]
    if (!url){
        await ctx.reply('Lütfen kaldırmak istediğiniz ürünün linkini sağlayın. Örnek: /remove <link>')
        return
    }
    const telegramId = ctx.from.id.toString();
    const user = await prisma.user.findUnique({
        where: { telegramId },
    })
    const product = await prisma.product.findUnique({
        where: { url },
    })
    const watchProduct = await prisma.watch.findFirst({ 
        where: {
            userId: user ? user.id : 0,
            productId: product ? product.id : 0,
        }
    })

    if (!user || !product || !watchProduct) {
        await ctx.reply('Bu ürünü takip etmiyorsunuz.')
        return
    }
    const deleted = await prisma.watch.deleteMany({
        where: {
            userId: user.id,
            productId: product.id,
        }
    })
    await ctx.reply(`Ürün takibi kaldırıldı: ${url}`)
 })

 bot.command('help' , async(ctx) => {
    await ctx.reply("Ürün takip etmek için /add <link> \nÜrünü takipten çıkartmak için /remove <link> \nTakip ettiklerinizi görmek için /list ")
 })

 

bot.command("check", async (ctx) => {
  const url = ctx.message.text.split(" ")[1];

  if (!url) {
    return ctx.reply("❌ Link gir kral");
  }

  await ctx.reply("🔍 Kontrol ediyorum...");

  const inStock = await checkStock(url);

  if (inStock) {
    await ctx.reply("✅ STOK VAR 🚀");
  } else {
    await ctx.reply("❌ Stok yok");
  }
});
