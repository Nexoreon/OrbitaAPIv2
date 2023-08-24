import nodemailer from 'nodemailer';

const sendEmail = async (options: { email: string, subject: string, message: string }) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASSWORD,
        },
    });

    const mailOptions = {
        from: 'Test <tiger000226@gmail.com',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;
