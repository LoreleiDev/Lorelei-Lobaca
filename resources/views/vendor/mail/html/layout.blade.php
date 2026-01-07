<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>{{ config('app.name') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style type="text/css">
        /* Reset dan base styles */
        body {
            margin: 0;
            padding: 0;
            background-color: #0a0e27;
            font-family: 'Arial', sans-serif;
            -webkit-text-size-adjust: none;
            width: 100% !important;
        }

        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }

        /* Wrapper dan layout */
        .wrapper {
            width: 100%;
            background: #0a0e27;
            padding: 30px 0;
        }

        .content {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border: 8px solid #1a237e;
            position: relative;
            overflow: hidden;
        }

        /* Persona 4 Card Border Effect */
        .content:before {
            content: "";
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
            z-index: -1;
        }

        /* Header styles - PERSONA 4 STYLE */
        .header {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
            padding: 50px 40px;
            text-align: center;
            position: relative;
            border-bottom: 6px solid #1a237e;
        }

        .header:after {
            content: "";
            position: absolute;
            bottom: -6px;
            left: 0;
            right: 0;
            height: 12px;
            background: repeating-linear-gradient(
                90deg,
                #1a237e 0px,
                #1a237e 20px,
                #FFD700 20px,
                #FFD700 40px
            );
        }

        .brand-name {
            color: #1a237e;
            font-size: 56px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 4px;
            display: block;
            position: relative;
            text-transform: uppercase;
            text-shadow: 3px 3px 0 rgba(255, 165, 0, 0.3), 6px 6px 0 rgba(26, 35, 126, 0.1);
            font-style: italic;
            padding: 20px 0;
            border-top: 4px dashed #1a237e;
            border-bottom: 4px dashed #1a237e;
        }

        .brand-name:before,
        .brand-name:after {
            content: "◆";
            margin: 0 15px;
            color: #1a237e;
        }

        /* Body content */
        .body {
            padding: 0;
        }

        .inner-body {
            width: 100%;
            max-width: 570px;
            margin: 0 auto;
        }

        .content-cell {
            padding: 50px 40px;
            color: #1a237e;
            line-height: 1.8;
            text-align: center;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);
        }

        .greeting {
            color: #1a237e;
            font-size: 32px;
            font-weight: 900;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 0 #FFD700;
            position: relative;
            padding: 20px 0;
            border-top: 3px solid #FFD700;
            border-bottom: 3px solid #FFD700;
        }

        .message-box {
            background: linear-gradient(135deg, #fff9e6 0%, #fffef0 100%);
            border: 3px solid #FFD700;
            border-left: 8px solid #FFD700;
            padding: 30px;
            border-radius: 0;
            margin: 30px 0;
            text-align: center;
            position: relative;
            box-shadow: 6px 6px 0 rgba(26, 35, 126, 0.2);
        }

        .message-box:before {
            content: "★";
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 28px;
            color: #FFD700;
            background: #ffffff;
            padding: 0 10px;
        }

        .message-box:after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
        }

        .message-text {
            color: #1a237e;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .token-display {
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            color: #FFD700;
            padding: 25px;
            border-radius: 0;
            text-align: center;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 3px;
            margin: 30px 0;
            border: 4px dashed #FFD700;
            display: inline-block;
            min-width: 280px;
            font-family: 'Courier New', monospace;
            box-shadow: 8px 8px 0 rgba(255, 215, 0, 0.3);
            text-transform: uppercase;
        }

        .warning-box {
            background: linear-gradient(135deg, #fff3e0 0%, #fffef0 100%);
            border: 2px solid #FFA500;
            border-left: 6px solid #FFA500;
            padding: 20px;
            border-radius: 0;
            margin: 25px 0;
            font-size: 14px;
            color: #1a237e;
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 4px 4px 0 rgba(26, 35, 126, 0.15);
            position: relative;
        }

        .warning-box:before {
            content: "⚠";
            margin-right: 8px;
            font-size: 18px;
        }

        /* Persona 4 Divider */
        .divider {
            height: 4px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
            margin: 25px 0;
        }

        /* Footer */
        .footer {
            background: linear-gradient(135deg, #1a237e 0%, #0f1750 100%);
            color: #FFD700;
            padding: 40px;
            text-align: center;
            position: relative;
            border-top: 6px solid #FFD700;
        }

        .footer:before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 6px;
            background: repeating-linear-gradient(
                90deg,
                #FFD700 0px,
                #FFD700 10px,
                transparent 10px,
                transparent 20px
            );
        }

        .footer-content {
            position: relative;
            z-index: 1;
        }

        .copyright {
            color: #FFD700;
            font-size: 12px;
            margin-top: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .content {
                margin: 10px;
                border-width: 6px;
            }

            .content-cell {
                padding: 30px 20px;
            }

            .header {
                padding: 40px 20px;
            }

            .brand-name {
                font-size: 40px;
                letter-spacing: 2px;
            }

            .greeting {
                font-size: 24px;
            }

            .token-display {
                font-size: 22px;
                padding: 18px;
                min-width: 240px;
            }

            .message-box {
                padding: 20px;
            }
        }

        @media only screen and (max-width: 480px) {
            .content-cell {
                padding: 20px;
            }

            .brand-name {
                font-size: 32px;
                letter-spacing: 1px;
                padding: 15px 0;
            }

            .brand-name:before,
            .brand-name:after {
                margin: 0 8px;
            }

            .token-display {
                font-size: 18px;
                min-width: 200px;
                padding: 15px;
                letter-spacing: 2px;
            }

            .message-box {
                padding: 18px;
                margin: 20px 0;
            }
        }
    </style>
    {!! $head ?? '' !!}
</head>
<body>
    <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <!-- Header -->
                    <tr>
                        <td class="header" width="100%" cellpadding="0" cellspacing="0">
                            <div class="logo-container">
                                <h1 class="brand-name">LOBACA</h1>
                            </div>
                        </td>
                    </tr>

                    <!-- Email Body -->
                    <tr>
                        <td class="body" width="100%" cellpadding="0" cellspacing="0">
                            <table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="content-cell">
                                        <div class="divider"></div>
                                        {!! Illuminate\Mail\Markdown::parse($slot) !!}
                                        <div class="divider"></div>
                                        {!! $subcopy ?? '' !!}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="footer" width="100%" cellpadding="0" cellspacing="0">
                            <div class="footer-content">
                                <p class="copyright">
                                    © {{ date('Y') }} LOBACA<br>
                                    ALL RIGHTS RESERVED
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>