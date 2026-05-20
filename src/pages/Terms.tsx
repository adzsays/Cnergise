import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Helmet>
        <title>Terms of Service — Cnergise</title>
        <meta name="description" content="Cnergise Terms of Service (Global Edition) — terms governing your use of the Cnergise productivity dashboard, including Google OAuth integrations." />
        <link rel="canonical" href="https://cnergise.com/terms" />
      </Helmet>

      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold">Cnergise</Link>
          <nav className="text-sm text-muted-foreground space-x-4">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 prose prose-neutral dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>
          <strong>Application Name:</strong> Cnergise<br />
          <strong>Effective Date:</strong> May 20, 2026<br />
          <strong>Last Updated:</strong> May 20, 2026<br />
          <strong>Document Version:</strong> 2.0 — Global Edition
        </p>

        <h2>1. Agreement to Terms</h2>
        <p>These Terms of Service constitute a legally binding agreement between you and Cnergise governing your access to and use of the Cnergise application, website, and all related services (the "Service").</p>
        <p>By creating an account, accessing, or using Cnergise, you confirm that you are at least 13 years of age (or 16 in the EEA), have read and understood these Terms and our Privacy Policy, agree to be legally bound by these Terms, and have the legal authority to enter into this Agreement.</p>

        <h2>2. Description of Service</h2>
        <p>Cnergise is a personalised productivity dashboard that allows users to integrate, view, and manage data across:</p>
        <ul>
          <li>Finance — budgeting, expense tracking, and financial summaries.</li>
          <li>Health & Wellness — fitness, nutrition, sleep, and wellbeing tracking.</li>
          <li>Projects & Tasks — project management, task lists, and milestone tracking.</li>
          <li>Calendar — unified calendar view integrating Google Calendar and other providers.</li>
          <li>Social & Professional Networks — LinkedIn professional updates and notifications.</li>
          <li>Email — Gmail inbox preview, smart filtering, and notification management.</li>
        </ul>
        <p>The Service connects to third-party providers (including Google and LinkedIn) via OAuth 2.0 authentication, where you explicitly grant authorisation. Features may change, be added, or discontinued with notice.</p>

        <h2>3. Account Registration and Security</h2>
        <h3>3.1 Account Creation</h3>
        <p>You agree to provide accurate, complete, and current registration information, promptly update it when it changes, keep your password confidential, and notify us at <a href="mailto:security@cnergise.com">security@cnergise.com</a> if you suspect unauthorised access.</p>
        <h3>3.2 Account Responsibility</h3>
        <p>You are solely responsible for all activity under your account. Cnergise is not liable for losses arising from your failure to maintain account security.</p>
        <h3>3.3 One Account Per User</h3>
        <p>Each user may maintain only one personal account.</p>

        <h2>4. Third-Party Integrations and OAuth Authorisation</h2>
        <h3>4.1 Your Consent to Connect</h3>
        <p>By authorising a third-party integration, you grant Cnergise permission to access the specific data scopes displayed on the OAuth consent screen, confirm you are the authorised account holder, and understand Cnergise will only access data necessary to deliver the features you activate.</p>
        <h3>4.2 Google Services Integration</h3>
        <p>Cnergise integrates with Google services (including Gmail and Google Calendar) under Google's OAuth 2.0 framework. Your use of Google services through Cnergise is additionally subject to the <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Google Terms of Service</a>, <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>, and <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>.</p>
        <p><strong>Cnergise's access to and use of Google user data strictly adheres to the Google API Services User Data Policy, including the Limited Use requirements.</strong> We will not use Google user data for advertising, profiling, or any purpose beyond delivering your dashboard features.</p>
        <h3>4.3 LinkedIn Integration</h3>
        <p>Your use of LinkedIn data through Cnergise is subject to the LinkedIn User Agreement and Privacy Policy. Cnergise uses LinkedIn data solely to populate your professional network widget.</p>
        <h3>4.4 Revoking Access</h3>
        <p>You may revoke any third-party integration at any time from within Cnergise (Settings → Connected Accounts → Disconnect) or directly from Google at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>. Revoking access removes the relevant widget and cached data within 24 hours.</p>

        <h2>5. Acceptable Use Policy</h2>
        <h3>5.1 Permitted Use</h3>
        <p>Cnergise is provided for your personal, non-commercial productivity use unless you hold an active commercial licence.</p>
        <h3>5.2 Prohibited Conduct</h3>
        <ul>
          <li>Misuse of third-party data beyond your personal dashboard.</li>
          <li>Unauthorised access to other users' accounts or non-public system areas.</li>
          <li>Reverse engineering, decompilation, or disassembly.</li>
          <li>Data scraping or automated extraction.</li>
          <li>System abuse, malicious code, or identity fraud.</li>
          <li>Any unlawful activity, including violations of data protection, IP, financial, or export control laws.</li>
          <li>Bypassing security or authentication mechanisms.</li>
          <li>Using Google user data for advertising, retargeting, or interest-based advertising.</li>
          <li>Unauthorised aggregation or export of user data for third-party purposes.</li>
        </ul>
        <p>Violations may result in immediate account suspension or termination.</p>

        <h2>6. Data Ownership and Intellectual Property</h2>
        <h3>6.1 Your Data</h3>
        <p>You retain full ownership of all personal data and content you provide. You grant Cnergise a limited, non-exclusive, non-transferable, revocable licence to access, process, and display your User Data solely to operate and improve the Service for you.</p>
        <h3>6.2 Cnergise Intellectual Property</h3>
        <p>All rights in the Cnergise application, software, design, features, branding, and content (excluding User Data) are owned by Cnergise or its licensors.</p>
        <h3>6.3 Feedback</h3>
        <p>Feedback you submit may be used by Cnergise on a perpetual, irrevocable, royalty-free basis to improve the Service.</p>

        <h2>7. Privacy</h2>
        <p>Your use of Cnergise is governed by our <Link to="/privacy">Privacy Policy (Global Edition)</Link>, incorporated into these Terms by reference.</p>

        <h2>8. Subscriptions, Payments, and Refunds</h2>
        <p>Details of current pricing and features are available at <a href="https://www.cnergise.com/pricing">cnergise.com/pricing</a>. Paid subscriptions are billed in advance on a monthly or annual basis. Cancel any time via Settings → Subscription. Refunds are provided in accordance with applicable consumer law (UK CRA 2015, EU Consumer Rights Directive, Australian Consumer Law, applicable US state laws). For billing errors, contact <a href="mailto:billing@cnergise.com">billing@cnergise.com</a> within 14 days.</p>

        <h2>9. Availability and Service Changes</h2>
        <p>Cnergise aims for high availability but does not guarantee uninterrupted or error-free access. We may modify, suspend, or discontinue any part of the Service with reasonable prior notice. Functionality partly depends on third-party APIs (Google, LinkedIn); we are not responsible for third-party outages or changes.</p>

        <h2>10. Financial and Health Information Disclaimer</h2>
        <p>Cnergise is a data aggregation and dashboard tool only. It does <strong>not</strong> provide financial advice, investment advice, regulated financial services, medical advice, clinical diagnosis, or healthcare services. Data displayed is for informational purposes only.</p>

        <h2>11. Disclaimers and Limitation of Liability</h2>
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CNERGISE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
        <p>Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded under applicable consumer protection laws.</p>

        <h2>12. Indemnification</h2>
        <p>You agree to indemnify Cnergise against claims arising out of your use of the Service, your breach of these Terms, your violation of third-party rights, or your User Data — except to the extent claims arise from our negligence, fraud, or wilful misconduct.</p>

        <h2>13. Termination</h2>
        <p>You may delete your account at any time via Settings → Account → Delete Account. Data will be removed within 30 days. Cnergise may suspend or terminate access for breach of these Terms, legal requirements, or security/legal/reputational risk. Surviving sections include IP, disclaimers, indemnification, limitation of liability, and dispute resolution.</p>

        <h2>14. Governing Law and Dispute Resolution</h2>
        <p>Unless a regional addendum specifies otherwise, these Terms are governed by the laws of England and Wales, with exclusive jurisdiction of the courts of England and Wales. Before formal proceedings, contact <a href="mailto:legal@cnergise.com">legal@cnergise.com</a> for informal resolution. EU/EEA consumers may use the <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">EU ODR platform</a>. California, Australian, and Brazilian users retain all applicable consumer protection rights.</p>

        <h2>15. General Provisions</h2>
        <p>These Terms, the Privacy Policy, and referenced policies constitute the entire agreement. If any provision is unenforceable, the remainder remains in effect. Our failure to enforce a provision is not a waiver. You may not assign your rights without our consent; Cnergise may assign without restriction. English controls in case of translation conflict. Force majeure events excuse non-performance.</p>

        <h2>16. Changes to These Terms</h2>
        <p>For material changes we update the "Last Updated" date, notify you at least 14 days in advance via email and/or in-app notification, and obtain renewed consent where required. Continued use after updates constitutes acceptance.</p>

        <h2>17. Contact Information</h2>
        <p>
          <strong>Cnergise Legal Team</strong><br />
          Legal: <a href="mailto:legal@cnergise.com">legal@cnergise.com</a><br />
          Privacy: <a href="mailto:privacy@cnergise.com">privacy@cnergise.com</a><br />
          Security: <a href="mailto:security@cnergise.com">security@cnergise.com</a><br />
          Billing: <a href="mailto:billing@cnergise.com">billing@cnergise.com</a><br />
          Website: <a href="https://www.cnergise.com/terms">cnergise.com/terms</a><br />
          Postal Address: London, England, United Kingdom
        </p>

        <h2>Regional Terms Addenda</h2>
        <h3>18. United Kingdom — Consumer Rights</h3>
        <p>Compliant with the Consumer Rights Act 2015, Consumer Contracts Regulations 2013, and Unfair Contract Terms Act 1977.</p>
        <h3>19. European Union / EEA — Consumer Rights</h3>
        <p>EU consumers have rights under the Consumer Rights Directive (2011/83/EU), including a 14-day right of withdrawal for digital services (subject to waiver when performance begins with consent).</p>
        <h3>20. United States — State-Specific Terms</h3>
        <p>California residents retain CCPA/CPRA rights. These Terms do not constitute regulated financial, investment, or medical advice. The FAA governs any arbitration provisions; no mandatory binding arbitration is imposed.</p>
        <h3>21. Brazil — Consumer Rights</h3>
        <p>Compliant with the Brazilian Consumer Defence Code (CDC, Law No. 8,078/1990). LGPD obligations are detailed in the Privacy Policy.</p>
        <h3>22. Canada — Consumer and Privacy Rights</h3>
        <p>PIPEDA rights are detailed in the Privacy Policy. Quebec residents have additional rights under Law 25.</p>
        <h3>23. Australia — Consumer Guarantees</h3>
        <p>Australian Consumer Law guarantees apply and cannot be excluded. Section 11 applies to the fullest extent permitted by Australian law.</p>
        <h3>24. India — DPDP Act 2023</h3>
        <p>Indian users have rights under the DPDP Act 2023 as detailed in the Privacy Policy.</p>
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Cnergise</span>
          <span><Link to="/privacy" className="hover:underline">Privacy Policy</Link></span>
        </div>
      </footer>
    </div>
  );
}
