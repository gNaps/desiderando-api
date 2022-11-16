import sgMail from "@sendgrid/mail";

export const sendMail = async ({
  to,
  subject,
  from = "desiderando@mail.com",
  html,
}) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  const msg = {
    to,
    from,
    subject,
    html,
  };
  await sgMail.send(msg);
};
