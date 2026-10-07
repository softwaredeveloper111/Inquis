import {config} from "../config/config.js"

const verificationEmailTemplate = ({ username, emailVerificationToken }) => {

  const verificationUrl =
  `${config.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}`;

  return(

    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your email</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f7f7f7;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f1f1f;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color: #f7f7f7; padding: 40px 16px;"
        >
          <tr>
            <td align="center">

             
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 520px;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  border: 1px solid #eeeeee;
                "
              >

           
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 32px 30px 24px;
                      border-bottom: 1px solid #f0f0f0;
                    "
                  >
                    <div
                      style="
                        font-size: 28px;
                        font-weight: 700;
                        color: #f97316;
                        letter-spacing: -0.5px;
                      "
                    >
                      Inquis
                    </div>
                  </td>
                </tr>

               
                <tr>
                  <td
                    align="center"
                    style="padding: 36px 32px 32px;"
                  >

                    <h1
                      style="
                        margin: 0 0 16px;
                        font-size: 24px;
                        line-height: 32px;
                        font-weight: 700;
                        color: #171717;
                      "
                    >
                      Verify your email
                    </h1>

                    <p
                      style="
                        margin: 0 0 12px;
                        font-size: 15px;
                        line-height: 24px;
                        color: #525252;
                      "
                    >
                      Hi ${username},
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        font-size: 15px;
                        line-height: 24px;
                        color: #525252;
                      "
                    >
                      Thank you for creating an account with
                      <strong style="color: #171717;">Inquis</strong>.
                      Please verify your email address to complete your registration.
                    </p>

                   
                    <table
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="margin: 0 auto 24px;"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            background-color: #f97316;
                            border-radius: 8px;
                          "
                        >
                          <a
                            href= ${verificationUrl}
                            style="
                              display: inline-block;
                              padding: 13px 28px;
                              font-size: 15px;
                              font-weight: 600;
                              color: #ffffff;
                              text-decoration: none;
                            "
                          >
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 0 0 20px;
                        font-size: 13px;
                        line-height: 21px;
                        color: #737373;
                      "
                    >
                      This verification link will expire soon.
                    </p>

                    <p
                      style="
                        margin: 0;
                        font-size: 13px;
                        line-height: 21px;
                        color: #737373;
                      "
                    >
                      If you did not create an Inquis account,
                      you can safely ignore this email.
                    </p>

                  </td>
                </tr>

              
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 20px 30px;
                      background-color: #fafafa;
                      border-top: 1px solid #eeeeee;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        line-height: 18px;
                        color: #a3a3a3;
                      "
                    >
                      © ${new Date().getFullYear()} Inquis. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `
  
  )
  
}

export default verificationEmailTemplate;