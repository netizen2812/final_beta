import React from "react";

const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-black text-[#052e16] mb-8 tracking-tight">Privacy Policy</h1>

                <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
                        <p>
                            Welcome to IMAM. Your privacy is critically important to us. This Privacy Policy outlines what information we collect, how we use it, and how we protect your data while you use our learning platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">2. Information We Collect</h2>
                        <p>
                            When you create an account, we may collect minimal personal information provided by authentication providers (such as Google), including:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Your name</li>
                            <li>Your email address</li>
                            <li>Authentication tokens used for single sign-on (SSO)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">3. How We Use Information</h2>
                        <p>
                            We use the collected information solely to provide, maintain, and improve the platform. This includes personalizing your educational experience, tracking your learning progress, and ensuring secure access to your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">4. Data Protection</h2>
                        <p>
                            We implement industry-standard security measures to protect your digital information against unauthorized access, alteration, or destruction. We limit access to your personal data to those who need to know it to operate our platform securely.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">5. Third Party Services</h2>
                        <p>
                            We use reliable third-party services to ensure a secure and smooth experience:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Clerk:</strong> Used for secure authentication and identity verification.</li>
                            <li><strong>Google Login:</strong> Facilitates easy and secure sign-in via SSO.</li>
                        </ul>
                        <p className="mt-2">
                            These providers have their own privacy policies governing the data they process on our behalf.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">6. Children's Learning Data</h2>
                        <p>
                            Our platform tracks learning progression, such as Quran reading metrics or ibadah tracking. This data is kept strictly within the context of your account to provide you with insights into your educational journey. We do not sell or share this learning data with third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">7. Changes to this Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the policy on this page. Your continued use of the platform after updates constitutes acceptance of the new policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">8. Contact</h2>
                        <p>
                            Contact: Please reach us through the contact section of the platform.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
