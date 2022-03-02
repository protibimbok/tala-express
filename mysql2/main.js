import geoip from "geoip-lite";
import {setTala, query} from "./db.js";
import {genTokenStr, getToken, shouldIgnore} from '../helpers.js';
import { cfg } from "../cfg.js";


async function checkToken(user, token){
    const rows = await query(cfg.checkSql, [user, token]);
    if(rows.length == 0) return false;
    else return rows[0];
}

export const genToken = async (req, uid) => {
    const token = req.chabi || genTokenStr();
    const browser = req.headers["user-agent"];
    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : "Unknown";
    const region = geo ? geo.region : "Unknown";

    const sql = 'INSERT INTO tala (user_id, token, saved, expires, browser, created_at) VALUES (?, ?, ?, ?, ?, ?) '+
                'ON DUPLICATE KEY UPDATE saved=VALUES(saved), expires=VALUES(expires)';
    await query(sql, [uid, token, 0, null, JSON.stringify({
        browser,
        country,    
        region
    }), new Date()]);
    return uid+'|'+token;
}

export const revokeToken = async (uid, token) => {
    token = token.split('|');
    token = token[token.length - 1];
    const sql = 'DELETE FROM tala WHERE user_id = ? AND token = ?';
    await query(sql, [uid, token]);
}

export const getOfUser = async (userId, page) => {
    page = page || 1;
    const offset = (page - 1) * 15;
    const sql = 'SELECT * FROM tala WHERE user_id = ? ORDER BY created_at DESC LIMIT 15 OFFSET ' + offset;
    return await query(sql, [userId]);
};

export const getOfToken = async (token, page) => {
    token = token.split('|');
    token = token[token.length - 1];
    page = page || 1;
    const offset = (page - 1) * 15;
    const sql = 'SELECT * FROM tala WHERE token = ? ORDER BY created_at DESC LIMIT 15 OFFSET ' + offset;
    return await query(sql, [token]);
}



export const ensureUser = (callback, ignores) => async (req, res, next) => {
    const [uid, token] = getToken(req).split('|');
    if(!token || !uid){
        if(shouldIgnore(ignores, req._parsedUrl.pathname)){
            next();
        }else{
            callback(req, res);
        }
        return;
    }
    const uData = await checkToken(uid, token);
    if(!uData){
        if(shouldIgnore(ignores, req._parsedUrl.pathname)){
            next();
        }else{
            callback(req, res);
        }
        return;
    }
    req.userId = uid;
    req.chabi = token;
    req.accessToken = uid+'|'+token;
    req.user = uData;
    next();
}


export {
    setTala
};