import {config} from "../config/config.js"

const afterEmailVerfiedTemplate = ()=>{

   const loggedInUrl = `${config.FRONTEND_URL}/login`

  return (
    `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verified</title>
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background-color: #f7f7f7;
        font-family: Arial, Helvetica, sans-serif;
        color: #171717;
      "
    >
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="min-height: 100vh; background-color: #f7f7f7;"
      >
        <tr>
          <td align="center" valign="middle" style="padding: 40px 16px;">

          
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                max-width: 480px;
                background-color: #ffffff;
                border: 1px solid #eeeeee;
                border-radius: 14px;
                overflow: hidden;
              "
            >

          
              <tr>
                <td
                  align="center"
                  style="
                    padding: 28px 30px;
                    border-bottom: 1px solid #f0f0f0;
                  "
                >
                  <div
                    style="
                      font-size: 26px;
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
                  style="padding: 42px 32px 40px;"
                >

                
                  <div
                    style="
                      width: 64px;
                      height: 64px;
                      margin: 0 auto 22px;
                      background-color: #fff7ed;
                      border-radius: 50%;
                      line-height: 64px;
                      font-size: 30px;
                    "
                  >
                    ✓
                  </div>

                  <h1
                    style="
                      margin: 0 0 14px;
                      font-size: 26px;
                      line-height: 34px;
                      font-weight: 700;
                      color: #171717;
                    "
                  >
                    Email verified successfully
                  </h1>

                  <p
                    style="
                      margin: 0 auto 28px;
                      max-width: 380px;
                      font-size: 15px;
                      line-height: 24px;
                      color: #737373;
                    "
                  >
                    Your email address has been successfully verified.
                    You can now log in to your Inquis account and get started.
                  </p>

               
                  <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="margin: 0 auto;"
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
                          href=${loggedInUrl}
                          style="
                            display: inline-block;
                            padding: 13px 30px;
                            font-size: 15px;
                            font-weight: 600;
                            color: #ffffff;
                            text-decoration: none;
                          "
                        >
                          Continue to Login
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

           
              <tr>
                <td
                  align="center"
                  style="
                    padding: 18px 30px;
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

export default afterEmailVerfiedTemplate