import { hashIdCoder } from "../lib/hashIds";

export const decode = (id: string) => {
    try {
        const parsedId = Number(hashIdCoder.decode(id));
        if (!parsedId)
            return null;
        return parsedId;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const encode = (id: number) => hashIdCoder.encode(id);

export const idParser = {
    decode,
    encode
}