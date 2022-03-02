import { v1 as token0 } from "uuid";
import {cfg} from './cfg.js';
export const genTokenStr = ()=> {
    /**
     * This reduces the risk of a token collision.
     */
    let possible = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM:.;?+=0123456789*";
    let token = token0().replaceAll("-", possible.charAt(Math.floor(Math.random() * possible.length)));
    for( let i=0; i < 4; i++ ){
        let pos = Math.floor(Math.random() * token.length);
        let newStr = "";
        for(let j = 0; j < 9; j++){
            newStr+=possible.charAt(Math.floor(Math.random() * possible.length));
        }
        token = token.substring(0, pos) + newStr + token.substring(pos);
    }
    return token;
}

export const getToken= (req) => {
    let key = req.headers[cfg.header];
    if(key){
        return key.replace(/^Bearer\s/, "");
    }
    if(cfg.cookie){
        key = req[cfg.cookie.type] && req[cfg.cookie.type][cfg.cookie.name];
    }
    return key;
}

export const shouldIgnore = (ignores, path) => {
    if(!ignores) return false;
    if(typeof ignores === 'string'){
        return path === ignores;
    }else if(typeof ignores === 'function'){
        return ignores(path);
    }else if(ignores instanceof RegExp){
        return ignores.test(path);
    }else if(ignores instanceof Array){
        for(let i = 0; i < ignores.length; i++){
            if(shouldIgnore(ignores[i], path)) return true;
        }
    }
    return false;
}
