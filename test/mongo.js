import mongoose from "mongoose";

export { setTala, genToken, ensureUser, getOfUser, getOfToken, revokeToken } from "../mongo/main.js";

mongoose.connect('mongodb://localhost:27017/tala');
export const User = mongoose.model('Users', {
    name: String
});
export {
    mongoose as database
};