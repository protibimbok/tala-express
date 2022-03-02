import {readFileSync} from 'fs';
import { dirname } from 'path';
import { cfg, setCfg } from '../cfg.js';
let conn, query;


function qHelper(sql, data){
    return new Promise((resolve, reject) => {
        conn.query(sql, data, (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

async function qHelperAsync(sql, data){
    const [rows] = await conn.query(sql, data);
    return rows;
}

export const setTala = async (dbConn, config)=>{
    conn = dbConn;
    setCfg(config);
    query = cfg.promise === true? qHelperAsync: qHelper;

    const sql = readFileSync(dirname(import.meta.url).substring(8)+'/migration.sql', 'utf8').toString();
    await query(sql);

    if(typeof cfg.userModel === 'string'){
        let sels;
        if(typeof cfg.populate === 'string'){
            sels = cfg.populate;
        }else if(Array.isArray(cfg.populate)){
            sels = cfg.populate.map(col => 'u.'+col).join(', ');
        }else{
            sels = ' NULL ';
        }
        cfg.checkSql = 'SELECT '+sels+' FROM `tala` t INNER JOIN `'+cfg.userModel+'` u ON u.'+cfg.foreignKey+' = t.user_id WHERE `user_id` = ? AND `token` = ?';
    }else{
        cfg.checkSql = 'SELECT user_id FROM `tala` WHERE `user_id` = ? AND `token` = ?'
    }
}

export {
    query
}