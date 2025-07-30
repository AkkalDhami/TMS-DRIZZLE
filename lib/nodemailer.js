import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
        user: 'flavie37@ethereal.email',
        pass: '4YGEFbeetEkhcV82Wy'
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `URL Shortener: <${testAccount.user}>`,
        to,
        subject,
        html
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Preview URL: ${previewUrl}`);
}