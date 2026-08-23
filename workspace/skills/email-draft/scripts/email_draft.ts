import nodemailer from "nodemailer";

export interface EmailDraft {
    to: string;
    subject: string;
    body: string;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

// STEP 1: Draft — never send without approval
export async function draftEmail(to: string, subject: string, body: string) {
    return { draft: { to, subject, body }, status: "pending_approval" };
}
// STEP 2: Send only after explicit human confirmation
export async function sendApprovedEmail(draft: EmailDraft): Promise<void> {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: draft.to,
        subject: draft.subject,
        html: draft.body,
    });
}

//Main method. 
// Three different intent: email_draft, email_approve, email_deny
// Call getsessionId (Done in orchestrator), but for main method call it here. If no lastResults, then skip printing it out. Grab city and run the marketAgent to get results.
// If lastResults and marketAgent returns no results. Then send error message saying. There's nothing to print out here. 
//If email field doesn't not exist or is a empty JSON object, create a draft and save it to session of the userId (Field name = email).
//If response = approved. Then update email.status via updateSession and send the email. Then delete/set to empty JSON object in email afterwards. 
//If response = denied, then simply delete/set to empty JSON object in email field. 