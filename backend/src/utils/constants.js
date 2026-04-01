const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || "sarthakjuneja1999@gmail.com,huzaifbarkati0@gmail.com,abhi.nebhani@gmail.com").split(',').map(e => e.trim().toLowerCase());

export const isRootAdmin = (email) => {
    if (!email) return false;
    return ROOT_ADMIN_EMAILS.includes(email.toLowerCase());
};

export const SCHOLAR_EMAILS = (process.env.SCHOLAR_EMAILS || "scholar1.imam@gmail.com")
  .split(',').map(e => e.trim().toLowerCase());

export const isDefaultScholar = (email) => {
    if (!email) return false;
    return SCHOLAR_EMAILS.includes(email.toLowerCase());
};

export default {
    ROOT_ADMIN_EMAILS,
    isRootAdmin,
    SCHOLAR_EMAILS,
    isDefaultScholar
};
