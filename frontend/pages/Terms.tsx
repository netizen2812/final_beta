import React from "react";

const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-black text-[#052e16] mb-8 tracking-tight">Terms of Service</h1>

                <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the IMAM platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">2. Use of Platform</h2>
                        <p>
                            You are granted a personal, non-exclusive, non-transferable, and revocable license to access and use the platform strictly in accordance with these Terms. As a condition of your use, you warrant that you will not use the platform for any purpose that is unlawful or prohibited by these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">3. Educational Content Disclaimer</h2>
                        <p>
                            The content provided on this platform is strictly for educational and informational purposes. While we strive to present accurate and reliable learning materials (including Quranic texts, ibadah tracking, etc.), the platform makes no guarantees regarding the absolute accuracy or completeness of the content provided natively or via AI generation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">4. User Conduct</h2>
                        <p>
                            You agree to use this platform with respect and integrity. You must not:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Engage in disruptive, offensive, or abusive behavior within the platform's chat or live features.</li>
                            <li>Attempt to gain unauthorized access to other user accounts or the platform's infrastructure.</li>
                            <li>Upload malicious code or use the platform in a way that harms the service or its servers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">5. Accounts and Access</h2>
                        <p>
                            To access certain features, you must create a secure account using external authentication providers (Clerk via Google or other methods). You are responsible for maintaining the confidentiality of your authentication details and are fully responsible for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">6. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by applicable law, IMAM and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data resulting from your use of the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">7. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify or replace these Terms at any time at our sole discretion. We will provide updates on this page. By continuing to access or use our platform after revisions become effective, you agree to be bound by the revised terms.
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

export default Terms;
