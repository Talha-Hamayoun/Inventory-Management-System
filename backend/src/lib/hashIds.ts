import HashIds from "hashids";

export const hashIdCoder = new HashIds(process.env.HASH_ID_SALT, 10);