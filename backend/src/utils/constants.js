const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || "").split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const SCHOLAR_EMAILS = (process.env.SCHOLAR_EMAILS || "").split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export const isRootAdmin = (email) => {
    if (!email) return false;
    return ROOT_ADMIN_EMAILS.includes(email.toLowerCase());
};

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
