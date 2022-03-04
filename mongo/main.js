import { setCfg, cfg } from "../cfg.js";
import geoip from "geoip-lite";
import {genTokenStr, getToken, shouldIgnore} from '../helpers.js';

let TalaModel, ObjectId;


export const setTala = (mongoose, config) => {
    let user;
    if(config.userModel && config.userModel.prototype instanceof mongoose.Model){
        user = {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.userModel
        };
    }else{
        user = mongoose.Schema.Types.ObjectId;
    }
    ObjectId = id => {
        try {
            return mongoose.Types.ObjectId(id);
        } catch (error) {
            return null;
        }
    };
    TalaModel = mongoose.model('Tala', {
        user,
        token: String,
        saved: Boolean,
        expires: Date,
        data: {
            browser: String,
            country: String,
            region: String
        },
        created_at: Date
    });
    setCfg(config);
}

async function checkToken(user, token){
    const finder = {
        user: ObjectId(user),
        token
    };
    const data = await (typeof cfg.populate === 'string' ?
        TalaModel.findOne(finder).populate('user', cfg.populate):
        TalaModel.findOne(finder)
    );
    if(!data){
        return false;
    }
    return data;
}

export const genToken = async (req, uid, saved, expires) => {
    const token = req.chabi || genTokenStr();
    const browser = req.headers["user-agent"];
    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : "Unknown";
    const region = geo ? geo.region : "Unknown";

    const entry = new TalaModel({
        user: ObjectId(uid),
        token: token,
        saved: !!saved,
        expires: expires || null,
        data: {
            browser,
            country,
            region
        },
        created_at: Date.now()
    });

    await entry.save();

    return uid+'|'+token;
}

export const revokeToken = async (uid, token) => {
    token = token.split('|');
    token = token[token.length - 1];
    await TalaModel.deleteOne({
        token,
        user: ObjectId(uid)
    });
}

export const getOfUser = async (userId, page) => {
    page = page || 1;
    const offset = (page - 1) * 15;
    const tokens = await TalaModel.find({
        user: ObjectId(userId)
    }).skip(offset).limit(15).exec();
    return tokens;
};

export const getOfToken = async (token, page) => {
    token = token.split('|');
    token = token[token.length - 1];
    page = page || 1;
    const offset = (page - 1) * 15;
    const users = await TalaModel.find({
        token
    }).skip(offset).limit(15).exec();
    return users;
}



export const ensureUser = (callback, ignores) => async (req, res, next) => {
    if(req.talaChecked){
        next();
        return;
    }
    req.talaChecked = true;

    const [uid, token] = getToken(req).split('|');
    if(!token || !uid){
        if(shouldIgnore(ignores, req._parsedUrl.pathname)){
            next();
        }else{
            callback(req, res);
        }
        return;
    }
    const lockData = await checkToken(uid, token);
    if(!lockData){
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
    req.user = lockData.user;

    next();
}
