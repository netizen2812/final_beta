import React from "react";

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-slate-50 border-t border-slate-200 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-center sm:text-left text-sm text-slate-500 font-medium">
                    &copy; {new Date().getFullYear()} IMAM. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    <a
                        href="/privacy"
                        className="text-sm text-slate-500 hover:text-[#052e16] transition-colors"
                    >
                        Privacy Policy
                    </a>
                    <a
                        href="/terms"
                        className="text-sm text-slate-500 hover:text-[#052e16] transition-colors"
                    >
                        Terms of Service
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
