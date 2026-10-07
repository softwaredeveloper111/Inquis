import { config } from "../config/config.js";

export const expiredVerificationTemplate = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Link Expired</title>
</head>

<body style="
  margin: 0;
  padding: 40px 20px;
  background-color: #f7f7f7;
  font-family: Arial, Helvetica, sans-serif;
  color: #222222;
">

  <div style="
    max-width: 520px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    overflow: hidden;
  ">

    <!-- Header -->
    <div style="
      padding: 36px 20px 30px;
      text-align: center;
      border-bottom: 1px solid #eeeeee;
    ">
      <h1 style="
        margin: 0;
        color: #ff6b1a;
        font-size: 28px;
        font-weight: 700;
      ">
        Inquis
      </h1>
    </div>

    <!-- Content -->
    <div style="
      padding: 38px 40px;
      text-align: center;
    ">

      <h2 style="
        margin: 0 0 20px;
        color: #222222;
        font-size: 24px;
        font-weight: 700;
      ">
        Verification link expired
      </h2>

      <p style="
        margin: 0 0 26px;
        color: #666666;
        font-size: 15px;
        line-height: 1.7;
      ">
        This email verification link has expired. 
        Please request a new verification email.
      </p>

      <a
        href="${config.FRONTEND_URL}/login"
        style="
          display: inline-block;
          padding: 14px 28px;
          background-color: #ff6b1a;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
        "
      >
        Go to Login
      </a>

    </div>

    <!-- Footer -->
    <div style="
      padding: 22px 20px;
      text-align: center;
      background-color: #fafafa;
      border-top: 1px solid #eeeeee;
    ">
      <p style="
        margin: 0;
        color: #999999;
        font-size: 12px;
      ">
        &copy; 2026 Inquis. All rights reserved.
      </p>
    </div>

  </div>

</body>
</html>
`;