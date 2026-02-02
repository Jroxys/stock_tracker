import { prisma } from '../lib/prisma.js';

async function getUser(ctx : any) {
  return prisma.user.findUnique({
    where: { telegramId: ctx.from.id.toString() }
  });
}
function sleep(ms:any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export { getUser , sleep};