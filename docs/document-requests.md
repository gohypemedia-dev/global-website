# Document request email delivery

The Downloads pages send document requests to `/api/document-requests`. No document files or attachments are delivered automatically. The team verifies the requester and sends the document manually.

To enable delivery later, add these server-only settings to `.env.local` locally and to your hosting environment in production:

```dotenv
RESEND_API_KEY=your_resend_api_key
DOCUMENT_REQUEST_FROM=Global Devices <requests@your-verified-domain.com>
DOCUMENT_REQUEST_TO=your-team@example.com
```

Use a sender domain verified in Resend, then restart the application. Never put these settings in `NEXT_PUBLIC_` variables or commit real credentials.

The recipient receives the visitor email, product category, document title and document ID. Reply-To is the visitor email. The UI confirms submission only after the email service accepts the message; that does not guarantee inbox delivery. Without configuration, the form returns an unavailable message and the public contact email.

Provider reference: https://resend.com/docs/api-reference/emails/send-email

Verification (uses mocked email delivery and sends no real emails):

```sh
npx tsx --test tests/document-requests.test.ts
```

The PDF specifies RDSO/SPN/256/2026 in the ELD heading but RDSO/SPN/256/2025 Ver 2.0 in the approval notice. Both are retained as supplied.

## Contact form

The Contact page posts name, email, phone and visitor type to `/api/contact`.
To activate it later, configure `RESEND_API_KEY`, `CONTACT_FROM` (verified sender),
and `CONTACT_TO` (recipient). `DOCUMENT_REQUEST_FROM` is also accepted as a sender fallback.
Restart the application after changing environment settings. Until configured,
the form reports that online enquiries are unavailable and points to the department
emails and central phone number; it does not falsely report success.

Contact validation and mocked-delivery check: `npx tsx --test tests/contact.test.ts`.
