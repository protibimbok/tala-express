export let cfg = {
    cookie: false,
    header: 'Authorization',
    populate: false,
    foreignKey: 'id'
};

export const setCfg = config => {
    cfg = {...cfg, ...config};
    if(config.cookie){
        if(typeof config.cookie === 'string'){
            cfg.cookie = {
                name: config.cookie,
                type: 'cookies',
            };
        }else{
            cfg.cookie = {
                name: config.cookie.name,
                type: config.cookie.signed === true? 'signedCookies': 'cookies',
            };
        }
    }
};