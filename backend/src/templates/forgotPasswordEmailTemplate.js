const forgotPasswordEmailTemplate = ({username, resetUrl}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Reset your password</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f7f7f7;
  font-family: Arial, Helvetica, sans-serif;
  color: #1f1f1f;
">

  <div style="
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 12px;
    overflow: hidden;
  ">

    <!-- Header -->
    <div style="
      padding: 28px 32px;
      border-bottom: 1px solid #eeeeee;
    ">
      <h1 style="
        margin: 0;
        color: #ff6b00;
        font-size: 24px;
        font-weight: 700;
      ">
        Inquis
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">

      <h2 style="
        margin: 0 0 16px;
        font-size: 24px;
      ">
        Reset your password
      </h2>

      <p style="
        margin: 0 0 16px;
        font-size: 15px;
        line-height: 1.6;
      ">
        Hi ${username},
      </p>

      <p style="
        margin: 0 0 24px;
        font-size: 15px;
        line-height: 1.6;
        color: #555555;
      ">
        We received a request to reset your Inquis password.
        Click the button below to create a new password.
      </p>

      <!-- Button -->
      <div style="margin: 30px 0;">
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 13px 24px;
            background-color: #ff6b00;
            color: #ffffff;
            text-decoration: none;
            border-radius: 7px;
            font-size: 15px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="
        margin: 0 0 12px;
        font-size: 13px;
        color: #777777;
        line-height: 1.5;
      ">
        This link will expire in <strong>5 minutes</strong>.
      </p>

      <p style="
        margin: 0;
        font-size: 13px;
        color: #777777;
        line-height: 1.5;
      ">
        If you didn't request a password reset, you can safely ignore
        this email.
      </p>

    </div>

    <!-- Footer -->
    <div style="
      padding: 20px 32px;
      background: #fafafa;
      border-top: 1px solid #eeeeee;
    ">
      <p style="
        margin: 0;
        font-size: 12px;
        color: #999999;
      ">
        © ${new Date().getFullYear()} Inquis. All rights reserved.
      </p>
    </div>

  </div>

</body>
</html>
`;
};


export default forgotPasswordEmailTemplate