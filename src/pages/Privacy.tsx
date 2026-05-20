import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Helmet>
        <title>Privacy Policy — Cnergise</title>
        <meta name="description" content="Cnergise Privacy Policy (Global Edition) — how we collect, use, and protect your data, including Google API Services User Data compliance." />
        <link rel="canonical" href="https://cnergise.com/privacy" />
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
        <h1>Privacy Policy</h1>
        <p>
          <strong>Application Name:</strong> Cnergise<br />
          <strong>Effective Date:</strong> May 20, 2026<br />
          <strong>Last Updated:</strong> May 20, 2026<br />
          <strong>Document Version:</strong> 2.0 — Global Edition
        </p>

        <h2>1. Introduction and Scope</h2>
        <p>
          Cnergise ("we," "us," "our," or "the App") is a personalised productivity and lifestyle dashboard that aggregates data across finance, health, projects, calendar, and social media services — including Gmail, LinkedIn, and other connected providers. This Privacy Policy describes how Cnergise collects, uses, stores, protects, and shares your personal data globally.
        </p>
        <p>
          This policy applies to all users of Cnergise worldwide, regardless of location. Where specific regional laws impose additional rights or obligations, those are set out in the Regional Addenda at the end of this document (Sections 18–24), which supplement but do not replace this core policy.
        </p>
        <p>By accessing or using Cnergise, you confirm you have read, understood, and agreed to this Privacy Policy. If you do not agree, please discontinue use of the App immediately.</p>

        <h2>2. Google API Services User Data Policy Disclosure</h2>
        <p>
          <strong>Cnergise's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</strong>
        </p>
        <p>In compliance with Google's Limited Use Policy, Cnergise:</p>
        <ul>
          <li>Does <strong>not</strong> allow humans to read your Google user data unless you have provided explicit affirmative consent to view specific messages, files, or calendar entries.</li>
          <li>Does <strong>not</strong> use or transfer your Google user data for serving advertisements, including retargeting, personalised, or interest-based advertising.</li>
          <li>Limits use of data strictly to providing or improving user-facing features prominently displayed within the Cnergise dashboard.</li>
          <li>Only transfers data to third parties when strictly necessary to provide or improve user-facing features visible in the App interface.</li>
        </ul>

        <h2>3. Who We Are (Data Controller)</h2>
        <p>Cnergise operates as the <strong>data controller</strong> for personal data processed through the App.</p>
        <p>
          <strong>Registered operator:</strong> Cnergise<br />
          <strong>Principal place of business:</strong> London, England, United Kingdom<br />
          <strong>Privacy contact:</strong> <a href="mailto:privacy@cnergise.com">privacy@cnergise.com</a><br />
          <strong>Website:</strong> <a href="https://www.cnergise.com">https://www.cnergise.com</a>
        </p>

        <h2>4. Information We Collect</h2>
        <h3>4.1 Information You Provide Directly</h3>
        <ul>
          <li><strong>Account Registration Data:</strong> Name, email address, username, and password (hashed and salted).</li>
          <li><strong>Profile Information:</strong> Preferences, notification settings, and dashboard configuration.</li>
          <li><strong>Financial Data:</strong> Budget categories, transaction labels, savings goals, and financial summaries you manually input or sync from authorised financial integrations.</li>
          <li><strong>Health Data:</strong> Fitness goals, activity metrics, nutrition logs, sleep data, and wellness indicators you provide or connect from health platforms.</li>
          <li><strong>Project Data:</strong> Task lists, project milestones, deadlines, notes, and collaboration preferences.</li>
        </ul>

        <h3>4.2 Data Accessed via OAuth and Third-Party Integrations</h3>
        <p>With your <strong>explicit prior consent</strong>, Cnergise may access data from the following providers:</p>
        <table>
          <thead><tr><th>Provider</th><th>Data Accessed</th><th>Purpose</th><th>Minimum Scope</th></tr></thead>
          <tbody>
            <tr><td>Gmail (Google)</td><td>Email metadata, labels, sender/recipient, subject lines</td><td>Unified inbox preview, smart notifications</td><td>gmail.readonly</td></tr>
            <tr><td>Google Calendar</td><td>Events, reminders, meeting details</td><td>Personalised calendar widget</td><td>calendar.readonly</td></tr>
            <tr><td>Google Drive</td><td>File names, folder structure (read-only)</td><td>Project document linking</td><td>drive.metadata.readonly</td></tr>
            <tr><td>LinkedIn</td><td>Profile summary, connection count, activity feed, notifications</td><td>Professional network widget</td><td>Profile & activity read</td></tr>
            <tr><td>Other OAuth Providers</td><td>As described at time of connection</td><td>Dashboard personalisation</td><td>Minimum necessary</td></tr>
          </tbody>
        </table>
        <p>We only request the minimum necessary scopes required to deliver the specific features you activate. You may revoke any integration at any time from your Cnergise account settings.</p>

        <h3>4.3 Automatically Collected Data</h3>
        <ul>
          <li><strong>Device & Technical Data:</strong> Device type, operating system, browser type, IP address, unique device identifiers, and app version.</li>
          <li><strong>Usage Data:</strong> Pages viewed, features used, click patterns, session duration, and error logs.</li>
          <li><strong>Log Data:</strong> Timestamps, access logs, and crash reports used for security monitoring and debugging.</li>
        </ul>

        <h3>4.4 Sensitive Data</h3>
        <p>Cnergise may process health and financial data, which may qualify as <strong>sensitive personal data</strong> under applicable law. We process such data only with your explicit consent and subject to enhanced security controls. We do not use sensitive data for automated profiling or advertising.</p>

        <h3>4.5 Cookies and Tracking Technologies</h3>
        <p>Cnergise uses strictly necessary cookies and session tokens to maintain login state and secure sessions. We do <strong>not</strong> use third-party advertising cookies or cross-site tracking technologies.</p>

        <h2>5. How We Use Your Information</h2>
        <ol>
          <li><strong>To provide and operate the Cnergise dashboard</strong> — rendering your personalised feed of finance, health, project, calendar, and social data.</li>
          <li><strong>To synchronise connected accounts</strong> — fetching updates from Gmail, LinkedIn, Google Calendar, and other authorised providers to populate your dashboard.</li>
          <li><strong>To personalise your experience</strong> — tailoring widget layouts, notification preferences, and insights based on your usage.</li>
          <li><strong>To send service communications</strong> — account confirmations, security alerts, and critical service updates.</li>
          <li><strong>To ensure security and prevent fraud</strong> — monitoring for unauthorised access, suspicious activity, and data breaches.</li>
          <li><strong>To improve the application</strong> — analysing aggregated, anonymised usage patterns to fix bugs and develop features.</li>
        </ol>

        <h2>6. Legal Bases for Processing</h2>
        <h3>6.1 EEA, UK, and Comparable Jurisdictions</h3>
        <ul>
          <li>Account creation and Service operation — Contractual necessity.</li>
          <li>OAuth-based data access — Explicit consent.</li>
          <li>Security monitoring — Legitimate interests.</li>
          <li>Legal compliance — Legal obligation.</li>
          <li>Analytics and product improvement — Legitimate interests.</li>
        </ul>
        <h3>6.2 Other Jurisdictions</h3>
        <p>We process data based on your consent, contractual necessity, and compliance with applicable local laws.</p>

        <h2>7. How We Share Your Information</h2>
        <p>We do not sell your personal data. We share it only with vetted service providers (hosting, analytics, customer support) under strict data processing agreements; as required by law; in the event of a business transfer (with notice); or with your explicit consent.</p>

        <h2>8. International Data Transfers</h2>
        <p>Where data is transferred outside its country of origin, Cnergise applies appropriate safeguards including Standard Contractual Clauses, UK IDTA, or equivalent mechanisms.</p>

        <h2>9. LinkedIn and Other Third-Party Data</h2>
        <ul>
          <li>LinkedIn data is used exclusively to populate the professional network widget on your dashboard.</li>
          <li>We do not store LinkedIn messages or private communications.</li>
          <li>LinkedIn data is not transferred to any other third-party application.</li>
          <li>Disconnect LinkedIn at any time via App Settings → Connected Accounts.</li>
        </ul>

        <h2>10. Data Security</h2>
        <ul>
          <li><strong>Encryption in Transit:</strong> TLS 1.2 or higher for all data in transit.</li>
          <li><strong>Encryption at Rest:</strong> Industry-standard encryption for stored data.</li>
          <li><strong>Access Controls:</strong> Strict role-based access; least-privilege principles.</li>
          <li><strong>Monitoring:</strong> Continuous security monitoring and breach detection.</li>
        </ul>

        <h2>11. Data Retention</h2>
        <ul>
          <li>Account data — Duration of account plus 30 days.</li>
          <li>Financial and health data — Duration of account plus 30 days.</li>
          <li>Anonymised analytics — Up to 24 months.</li>
          <li>Security and access logs — Up to 12 months.</li>
          <li>Backup copies — Up to 30 days post-account deletion.</li>
        </ul>

        <h2>12. Account and Data Deletion</h2>
        <p>Delete your account at any time from <strong>Settings → Account → Delete Account</strong>, or by emailing <a href="mailto:privacy@cnergise.com">privacy@cnergise.com</a>. We will remove your data from active systems within 30 days, with backups expiring within an additional 30 days.</p>

        <h2>13. Your Privacy Rights</h2>
        <ul>
          <li>Access, correction, deletion, restriction, and objection to processing.</li>
          <li>Withdraw consent for any consent-based processing at any time.</li>
          <li>Portability of your data in a structured, machine-readable format.</li>
          <li>Non-discrimination for exercising your privacy rights.</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>To exercise these rights, contact <strong>privacy@cnergise.com</strong>. We respond to all verified requests within 30 days (or sooner as required by local law).</p>

        <h2>14. Children's Privacy</h2>
        <p>Cnergise is not directed to children under 13 (or 16 in the EEA). We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us so we can delete it.</p>

        <h2>15. Automated Decision-Making</h2>
        <p>Cnergise does not engage in solely automated decision-making producing legal or similarly significant effects.</p>

        <h2>16. Changes to This Policy</h2>
        <p>We may update this Policy. When we do, we will update the "Last Updated" date, notify you via email and/or in-app notice at least 14 days before changes take effect, and obtain renewed consent where required by law.</p>

        <h2>17. Contact Us</h2>
        <p>
          <strong>Cnergise Privacy Team</strong><br />
          Email: <a href="mailto:privacy@cnergise.com">privacy@cnergise.com</a><br />
          Website: <a href="https://www.cnergise.com/privacy">https://www.cnergise.com/privacy</a><br />
          Postal Address: London, England, United Kingdom
        </p>

        <h2>Regional Addenda</h2>
        <h3>18. United Kingdom — UK GDPR / Data Protection Act 2018</h3>
        <p>UK users may contact the ICO (<a href="https://ico.org.uk" target="_blank" rel="noreferrer">ico.org.uk</a>, helpline 0303 123 1113). We will notify the ICO within 72 hours of a qualifying personal data breach.</p>

        <h3>19. European Union / EEA — GDPR</h3>
        <p>Governed by Regulation (EU) 2016/679. EEA users have full rights of access, rectification, erasure, restriction, portability, and objection.</p>

        <h3>20. California (USA) — CCPA/CPRA</h3>
        <p>California residents have the right to know, delete, correct, opt out of sale/sharing, limit use of sensitive personal information, and non-discrimination. Cnergise does not sell personal information.</p>

        <h3>21. Brazil — LGPD</h3>
        <p>Processing is based on consent and contract performance. Health and financial data are treated as sensitive under LGPD Art. 11. DPO: <a href="mailto:privacy@cnergise.com">privacy@cnergise.com</a>.</p>

        <h3>22. Canada — PIPEDA</h3>
        <p>Collection, use, and disclosure with meaningful consent. Access and correction rights available; contact our Privacy Team.</p>

        <h3>23. Australia — Privacy Act 1988 (APPs)</h3>
        <p>We comply with the Australian Privacy Principles. Complaints may be lodged with the OAIC (<a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">oaic.gov.au</a>).</p>

        <h3>24. India — DPDP Act 2023</h3>
        <p>Indian Data Principals have rights of access, correction, erasure, and grievance redressal. Supervisory authority: Data Protection Board of India.</p>
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Cnergise</span>
          <span><Link to="/terms" className="hover:underline">Terms of Service</Link></span>
        </div>
      </footer>
    </div>
  );
}
