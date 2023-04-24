import Joi from "joi";
import { stripHtml } from "string-strip-html";

function applyStripHtml(target) {
    if (typeof (target) === 'string') return stripHtml(target).result;
    else return target;
}

const userSchemes = {
    postSignUp: Joi.object({
        name: Joi.string().min(3).max(50).required().custom(applyStripHtml).trim(),
        email: Joi.string().email().required().custom(applyStripHtml).trim(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().trim()
    }),
    postLogin: Joi.object({
        email: Joi.string().email().required().custom(applyStripHtml).trim(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().trim()
    })
}

export default userSchemes;