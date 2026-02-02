import axios from 'axios';
import * as cheerio from 'cheerio';

export async function checkStock(url:string) {
    try{
        const {data} = await axios.get(url,{
            headers: {
                "User-Agent": 
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        })
        const $ = cheerio.load(data)
        const addToCartButton  = $(".add-to-cart, .addToCart, button[type='submit'], div:contains('SEPETE EKLE')")

         if (addToCartButton.length > 0) {
      return true; // stokta 
    }
    return false; // stokta yoksa


    }
    catch(error:any){
        console.log("Stock kontrol hatası :", error.message) // hata verirse
    
        return false;
    }
    
}