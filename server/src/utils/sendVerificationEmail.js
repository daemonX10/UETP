const resend = require("../libs/resend");

async function sendVerificationEmail(username , email, verifyCode ){
    console.log("email", email)

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h1>Hello, ${username}!</h1>
            <p>Thank you for signing up with MystryMessage. Please use the verification code below to complete your registration:</p>
            <h2 style="color: #007BFF;">${verifyCode}</h2>
            <p>If you did not sign up for an account, please ignore this email.</p>
        </div>
    `;

    try {
            await resend.emails.send({
            from : 'www.mystrymsg.com',
            to : email,
            subject : 'Verify your MystryMessage account',
            html: emailHtml
        })

        return {success: true, message: "Verification email sent successfully"};
    } catch (error) {
        console.error('error sending verification email', error)
        return { success: false, message: 'Failed to send verification email' };
    }
}

module.exports = { sendVerificationEmail };